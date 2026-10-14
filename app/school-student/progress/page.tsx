"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Flame,
  Gamepad2,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type GameResult = {
  game_name: string;
  subject: string;
  topic: string;
  score: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy: number;
  xp_earned: number;
  created_at: string;
};

type SubjectProgress = {
  name: string;
  progress: number;
  questions: number;
};

function calculateStreak(results: GameResult[]) {
  if (results.length === 0) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(
      results.map((result) => {
        const date = new Date(result.created_at);

        return new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        ).getTime();
      })
    )
  ).sort((a, b) => b - a);

  const today = new Date();

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

  let streak = 0;

  if (
    uniqueDays[0] !== todayStart &&
    uniqueDays[0] !== yesterdayStart
  ) {
    return 0;
  }

  let expectedDay = uniqueDays[0];

  for (const day of uniqueDays) {
    if (day === expectedDay) {
      streak += 1;
      expectedDay -= 24 * 60 * 60 * 1000;
    } else {
      break;
    }
  }

  return streak;
}

function calculateLevel(xp: number) {
  return Math.floor(xp / 500) + 1;
}

function calculateLevelProgress(xp: number) {
  return ((xp % 500) / 500) * 100;
}

export default function ProgressPage() {
  const [studentName, setStudentName] = useState("Student");
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("user_id", user.id)
          .single();

        if (profileError || !profile) {
          console.error("Could not load profile:", profileError);
          window.location.href = "/login";
          return;
        }

        if (profile.role !== "SCHOOL_STUDENT") {
          window.location.href = "/";
          return;
        }

        setStudentName(profile.full_name || "Student");

        const { data: gameResults, error: resultsError } = await supabase
          .from("game_results")
          .select(
            "game_name, subject, topic, score, correct_answers, incorrect_answers, accuracy, xp_earned, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (resultsError) {
          console.error("Could not load game results:", resultsError);
          setResults([]);
          return;
        }

        setResults((gameResults as GameResult[]) || []);
      } catch (error) {
        console.error("Unexpected progress error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, []);

  if (loading) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-content">
          <p className="dashboard-label">EDUQUEST</p>
          <h1>Loading your progress...</h1>
        </section>
      </main>
    );
  }

  const totalXp = results.reduce(
    (total, result) => total + Number(result.xp_earned || 0),
    0
  );

  const totalPoints = results.reduce(
    (total, result) => total + Number(result.score || 0),
    0
  );

  const gamesPlayed = results.length;

  const totalCorrect = results.reduce(
    (total, result) => total + Number(result.correct_answers || 0),
    0
  );

  const totalIncorrect = results.reduce(
    (total, result) => total + Number(result.incorrect_answers || 0),
    0
  );

  const totalQuestions = totalCorrect + totalIncorrect;

  const overallAccuracy =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

  const streak = calculateStreak(results);
  const level = calculateLevel(totalXp);
  const levelProgress = calculateLevelProgress(totalXp);
  const xpToNextLevel = 500 - (totalXp % 500);

  const subjectMap = new Map<
    string,
    {
      correct: number;
      incorrect: number;
    }
  >();

  results.forEach((result) => {
    const subject = result.subject || "General";

    const current = subjectMap.get(subject) || {
      correct: 0,
      incorrect: 0,
    };

    current.correct += Number(result.correct_answers || 0);
    current.incorrect += Number(result.incorrect_answers || 0);

    subjectMap.set(subject, current);
  });

  const subjectProgress: SubjectProgress[] = Array.from(
    subjectMap.entries()
  )
    .map(([name, data]) => {
      const questions = data.correct + data.incorrect;

      return {
        name,
        questions,
        progress:
          questions > 0
            ? Math.round((data.correct / questions) * 100)
            : 0,
      };
    })
    .sort((a, b) => b.progress - a.progress);

  const strongestSubject =
    subjectProgress.length > 0
      ? subjectProgress[0].name
      : "No data yet";

  const weakestSubject =
    subjectProgress.length > 0
      ? subjectProgress[subjectProgress.length - 1].name
      : "No data yet";

  const displaySubjects =
    subjectProgress.length > 0
      ? subjectProgress.slice(0, 4)
      : [
          {
            name: "No subjects yet",
            progress: 0,
            questions: 0,
          },
        ];

  const achievements = [
    {
      title: "First Game",
      description: "Complete your first learning game",
      earned: gamesPlayed >= 1,
      progress: Math.min(gamesPlayed, 1),
      target: 1,
      icon: Gamepad2,
    },
    {
      title: "Knowledge Hunter",
      description: "Complete 10 learning games",
      earned: gamesPlayed >= 10,
      progress: Math.min(gamesPlayed, 10),
      target: 10,
      icon: Trophy,
    },
    {
      title: "XP Builder",
      description: "Earn 500 XP",
      earned: totalXp >= 500,
      progress: Math.min(totalXp, 500),
      target: 500,
      icon: Zap,
    },
    {
      title: "7-Day Streak",
      description: "Learn for 7 consecutive days",
      earned: streak >= 7,
      progress: Math.min(streak, 7),
      target: 7,
      icon: Flame,
    },
  ];

  const earnedAchievements = achievements.filter(
    (achievement) => achievement.earned
  ).length;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a href="/school-student" className="back-button">
          <ArrowLeft size={17} />
          Back to Dashboard
        </a>

        <div className="dashboard-brand">
          <div className="dashboard-logo">
            <Target size={21} />
          </div>
          <span>EDUQUEST</span>
        </div>

        <div className="student-profile">
          <div className="avatar">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <span>{studentName}</span>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="welcome">
          <p className="dashboard-label">MY PROGRESS</p>

          <h1>
            See how far
            <span> you've grown.</span>
          </h1>

          <p>
            Your progress is calculated from your real EDUQUEST learning
            activity.
          </p>
        </div>

        <div className="progress-stats">
          <div className="progress-stat-card">
            <div className="progress-stat-icon">
              <Zap size={22} />
            </div>
            <span>XP</span>
            <strong>{totalXp.toLocaleString()}</strong>
          </div>

          <div className="progress-stat-card">
            <div className="progress-stat-icon">
              <Trophy size={22} />
            </div>
            <span>Points</span>
            <strong>{totalPoints.toLocaleString()}</strong>
          </div>

          <div className="progress-stat-card">
            <div className="progress-stat-icon">
              <Gamepad2 size={22} />
            </div>
            <span>Games Played</span>
            <strong>{gamesPlayed}</strong>
          </div>

          <div className="progress-stat-card">
            <div className="progress-stat-icon">
              <Flame size={22} />
            </div>
            <span>Learning Streak</span>
            <strong>
              {streak} {streak === 1 ? "day" : "days"}
            </strong>
          </div>

          <div className="progress-stat-card">
            <div className="progress-stat-icon">
              <Target size={22} />
            </div>
            <span>Accuracy</span>
            <strong>{overallAccuracy}%</strong>
          </div>

          <div className="progress-stat-card">
            <div className="progress-stat-icon">
              <Award size={22} />
            </div>
            <span>Current Level</span>
            <strong>Level {level}</strong>
          </div>
        </div>

        <div className="progress-columns">
          <section className="progress-panel">
            <div className="progress-panel-heading">
              <div>
                <p className="dashboard-label">SUBJECT PROGRESS</p>
                <h2>Keep growing</h2>
              </div>
              <BookOpen size={20} />
            </div>

            <div className="subject-progress-list">
              {displaySubjects.map((subject) => (
                <div
                  className="subject-progress"
                  key={subject.name}
                >
                  <div className="subject-progress-top">
                    <span>{subject.name}</span>
                    <strong>{subject.progress}%</strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-value"
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="level-progress-section">
              <div className="subject-progress-top">
                <span>Level {level} progress</span>
                <strong>{Math.round(levelProgress)}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-value"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>

              <p className="level-progress-note">
                {xpToNextLevel === 500
                  ? "Earn XP to begin your next level."
                  : `${xpToNextLevel} XP until the next level.`}
              </p>
            </div>
          </section>

          <section className="progress-panel">
            <div className="progress-panel-heading">
              <div>
                <p className="dashboard-label">LEARNING INSIGHT</p>
                <h2>What to practice</h2>
              </div>
              <Target size={20} />
            </div>

            <div className="insight-box">
              <strong>Area requiring more practice</strong>
              <h3>{weakestSubject}</h3>

              <p>
                {subjectProgress.length > 0
                  ? `Your current lowest-performing subject is ${weakestSubject}. Practice more questions and challenges here.`
                  : "Complete a learning game to start generating personalized insights."}
              </p>

              <a href="/school-student/games">
                Practice with a game →
              </a>
            </div>

            <div className="insight-box">
              <strong>Strongest subject</strong>
              <h3>{strongestSubject}</h3>

              <p>
                {subjectProgress.length > 0
                  ? `You're currently performing strongest in ${strongestSubject}. Keep challenging yourself.`
                  : "Your strongest subject will appear after you complete learning activities."}
              </p>
            </div>
          </section>
        </div>

        <section className="achievements-preview">
          <div>
            <p className="dashboard-label">ACHIEVEMENTS</p>
            <h2>
              Your recent milestones
              <span className="achievement-count">
                {earnedAchievements}/{achievements.length}
              </span>
            </h2>
          </div>

          <div className="achievement-row">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;

              return (
                <div
                  className={`achievement ${
                    achievement.earned ? "" : "achievement-locked"
                  }`}
                  key={achievement.title}
                >
                  <div className="achievement-icon">
                    <Icon size={19} />
                  </div>

                  <div>
                    <strong>{achievement.title}</strong>

                    <span>
                      {achievement.earned
                        ? "Earned"
                        : `${achievement.progress}/${achievement.target}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}