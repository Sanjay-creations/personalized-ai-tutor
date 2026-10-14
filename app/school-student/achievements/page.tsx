"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  Flame,
  Gamepad2,
  Lock,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type GameResult = {
  xp_earned: number;
  created_at: string;
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

  const yesterdayStart =
    todayStart - 24 * 60 * 60 * 1000;

  if (
    uniqueDays[0] !== todayStart &&
    uniqueDays[0] !== yesterdayStart
  ) {
    return 0;
  }

  let streak = 0;
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

export default function AchievementsPage() {
  const [studentName, setStudentName] = useState("Student");
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAchievementData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("user_id", user.id)
            .single();

        if (profileError || !profile) {
          console.error(
            "Could not load profile:",
            profileError
          );
          window.location.href = "/login";
          return;
        }

        if (profile.role !== "SCHOOL_STUDENT") {
          window.location.href = "/";
          return;
        }

        setStudentName(profile.full_name || "Student");

        const { data: gameResults, error: resultsError } =
          await supabase
            .from("game_results")
            .select("xp_earned, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (resultsError) {
          console.error(
            "Could not load game results:",
            resultsError
          );
          return;
        }

        const results = (gameResults as GameResult[]) || [];

        const xp = results.reduce(
          (total, result) =>
            total + Number(result.xp_earned || 0),
          0
        );

        setGamesPlayed(results.length);
        setTotalXp(xp);
        setStreak(calculateStreak(results));
      } catch (error) {
        console.error(
          "Achievement loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadAchievementData();
  }, []);

  if (loading) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-content">
          <p className="dashboard-label">EDUQUEST</p>
          <h1>Loading your achievements...</h1>
        </section>
      </main>
    );
  }

  const achievements = [
    {
      title: "First Game",
      description: "Complete your first learning game",
      progress: `${Math.min(gamesPlayed, 1)} / 1`,
      earned: gamesPlayed >= 1,
      progressPercent: Math.min(gamesPlayed, 1) * 100,
      icon: Gamepad2,
    },
    {
      title: "Knowledge Hunter",
      description: "Complete 10 learning games",
      progress: `${Math.min(gamesPlayed, 10)} / 10`,
      earned: gamesPlayed >= 10,
      progressPercent: Math.min(
        (gamesPlayed / 10) * 100,
        100
      ),
      icon: Trophy,
    },
    {
      title: "XP Builder",
      description: "Earn 500 XP",
      progress: `${Math.min(totalXp, 500)} / 500`,
      earned: totalXp >= 500,
      progressPercent: Math.min(
        (totalXp / 500) * 100,
        100
      ),
      icon: Zap,
    },
    {
      title: "7-Day Streak",
      description: "Learn for 7 consecutive days",
      progress: `${Math.min(streak, 7)} / 7`,
      earned: streak >= 7,
      progressPercent: Math.min(
        (streak / 7) * 100,
        100
      ),
      icon: Flame,
    },
  ];

  const earnedAchievements = achievements.filter(
    (achievement) => achievement.earned
  ).length;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a
          href="/school-student"
          className="back-button"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </a>

        <div className="dashboard-brand">
          <div className="dashboard-logo">
            <Trophy size={21} />
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
          <p className="dashboard-label">
            ACHIEVEMENTS
          </p>

          <h1>
            Celebrate your
            <span> progress.</span>
          </h1>

          <p>
            Every lesson, quiz and challenge takes you one
            step further. Keep learning and collect new
            achievements along the way.
          </p>
        </div>

        <div className="achievement-summary">
          <div className="achievement-summary-card">
            <div className="achievement-summary-icon">
              <Trophy size={23} />
            </div>

            <div>
              <span>Achievements Earned</span>

              <strong>
                {earnedAchievements} /{" "}
                {achievements.length}
              </strong>
            </div>
          </div>

          <div className="achievement-summary-card">
            <div className="achievement-summary-icon">
              <Zap size={23} />
            </div>

            <div>
              <span>Total XP</span>

              <strong>
                {totalXp.toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="achievement-summary-card">
            <div className="achievement-summary-icon">
              <Flame size={23} />
            </div>

            <div>
              <span>Current Streak</span>

              <strong>
                {streak}{" "}
                {streak === 1 ? "day" : "days"}
              </strong>
            </div>
          </div>
        </div>

        <div className="achievement-grid">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;

            return (
              <div
                key={achievement.title}
                className={`achievement-card ${
                  achievement.earned
                    ? "earned"
                    : "locked"
                }`}
              >
                <div className="achievement-card-top">
                  <div className="achievement-large-icon">
                    {achievement.earned ? (
                      <Icon size={28} />
                    ) : (
                      <Lock size={25} />
                    )}
                  </div>

                  {achievement.earned && (
                    <span className="earned-badge">
                      EARNED
                    </span>
                  )}
                </div>

                <h2>{achievement.title}</h2>

                <p>{achievement.description}</p>

                <div className="achievement-progress">
                  <span>{achievement.progress}</span>

                  <div className="progress-track">
                    <div
                      className="progress-value"
                      style={{
                        width: `${achievement.progressPercent}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="achievement-message">
          <Award size={22} />

          <div>
            <strong>Keep going!</strong>

            <p>
              Your next achievement is waiting. Complete
              more learning challenges to unlock it.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}