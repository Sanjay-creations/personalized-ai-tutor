"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  Code2,
  FileText,
  FlaskConical,
  GraduationCap,
  LogOut,
  Target,
  Trophy,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type GameResult = {
  user_id: string;
  subject: string | null;
  correct_answers: number | null;
  incorrect_answers: number | null;
  xp_earned: number | null;
  created_at: string;
};

type CollegeStats = {
  xp: number;
  quizzesCompleted: number;
  accuracy: number;
};

const tools = [
  {
    title: "My Courses",
    description:
      "Access your subjects, notes and current learning materials.",
    icon: BookOpen,
    href: "/college-student/courses",
  },
  {
    title: "AI Research Assistant",
    description:
      "Explore concepts, summarize material and develop ideas with AI.",
    icon: Brain,
    href: "/college-student/ai-research",
  },
  {
    title: "Mock Tests",
    description:
      "Practice examination-style questions under timed conditions.",
    icon: FileText,
    href: "/college-student/mock-tests",
  },
  {
    title: "Programming Challenges",
    description:
      "Improve coding and problem-solving through practical challenges.",
    icon: Code2,
    href: "/school-student/games",
  },
  {
    title: "Study Planner",
    description:
      "Organize study sessions, tasks and upcoming examinations.",
    icon: CalendarDays,
    href: "/college-student/study-planner",
  },
  {
    title: "Performance Analytics",
    description:
      "Understand your accuracy, progress and areas for improvement.",
    icon: BarChart3,
    href: "/college-student/analytics",
  },
];

export default function CollegeStudentPage() {
  const [studentName, setStudentName] =
    useState("College Student");

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [stats, setStats] =
    useState<CollegeStats>({
      xp: 0,
      quizzesCompleted: 0,
      accuracy: 0,
    });

  const [loadingStats, setLoadingStats] =
    useState(true);

  useEffect(() => {
    async function loadCollegeStudentData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("user_id", user.id)
          .single();

        if (profileError || !profile) {
          console.error(
            "Could not load college student profile:",
            profileError
          );

          window.location.href = "/login";
          return;
        }

        if (profile.role !== "COLLEGE_STUDENT") {
          window.location.href = "/";
          return;
        }

        setStudentName(
          profile.full_name || "College Student"
        );

        setCheckingAccess(false);

        const {
          data: results,
          error: resultsError,
        } = await supabase
          .from("game_results")
          .select(
            "user_id, subject, correct_answers, incorrect_answers, xp_earned, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (resultsError) {
          console.error(
            "Could not load college student game results:",
            resultsError
          );

          return;
        }

        const gameResults =
          (results as GameResult[]) || [];

        const totalXp = gameResults.reduce(
          (total, result) =>
            total +
            Number(result.xp_earned || 0),
          0
        );

        const totalCorrect =
          gameResults.reduce(
            (total, result) =>
              total +
              Number(
                result.correct_answers || 0
              ),
            0
          );

        const totalIncorrect =
          gameResults.reduce(
            (total, result) =>
              total +
              Number(
                result.incorrect_answers || 0
              ),
            0
          );

        const totalQuestions =
          totalCorrect + totalIncorrect;

        const overallAccuracy =
          totalQuestions > 0
            ? Math.round(
                (totalCorrect /
                  totalQuestions) *
                  100
              )
            : 0;

        setStats({
          xp: totalXp,
          quizzesCompleted:
            gameResults.length,
          accuracy: overallAccuracy,
        });
      } catch (error) {
        console.error(
          "College student dashboard error:",
          error
        );
      } finally {
        setCheckingAccess(false);
        setLoadingStats(false);
      }
    }

    loadCollegeStudentData();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Logout failed:",
        error
      );

      setLoggingOut(false);
      return;
    }

    window.location.href = "/login";
  }

  const currentXp = stats.xp;

  const currentLevel =
    Math.floor(currentXp / 1000) + 1;

  const xpIntoCurrentLevel =
    currentXp % 1000;

  const xpToNextLevel =
    1000 - xpIntoCurrentLevel;

  const levelProgress =
    Math.round(
      (xpIntoCurrentLevel / 1000) * 100
    );

  if (checkingAccess) {
    return (
      <main className="college-page">
        <section className="college-main">
          <p className="college-label">
            EDUQUEST
          </p>

          <h1>
            Loading your workspace...
          </h1>
        </section>
      </main>
    );
  }

  return (
    <main className="college-page">
      <header className="college-header">
        <a
          href="/"
          className="college-brand"
        >
          <div className="college-logo">
            <GraduationCap size={20} />
          </div>

          <span>
            EDUQUEST
          </span>
        </a>

        <nav className="college-nav">
          <a href="#tools">
            Learning
          </a>

          <a href="#roadmap">
            Roadmap
          </a>

          <a href="#analytics">
            Analytics
          </a>
        </nav>

        <div className="college-actions">
          <div className="college-user">
            <div className="college-avatar">
              {studentName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {studentName}
              </strong>

              <span>
                College Student
              </span>
            </div>

            <button
              className="college-logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut size={16} />

              {loggingOut
                ? "Signing out..."
                : "Sign out"}
            </button>
          </div>
        </div>
      </header>

      <section className="college-main">
        {/* Welcome */}
        <div className="college-welcome">
          <div>
            <p className="college-label">
              COLLEGE STUDENT
            </p>

            <h1>
              Study smarter.
              <span>
                {" "}
                Build your future.
              </span>
            </h1>

            <p>
              Your personalized workspace for learning,
              projects, exam preparation and skill
              development.
            </p>
          </div>

          <div className="college-level">
            <span>
              LEVEL {currentLevel}
            </span>

            <strong>
              {currentXp.toLocaleString()} XP
            </strong>

            <div className="college-level-track">
              <div
                className="college-level-value"
                style={{
                  width: `${levelProgress}%`,
                }}
              />
            </div>

            <small>
              {loadingStats
                ? "Loading..."
                : `${xpToNextLevel.toLocaleString()} XP to next level`}
            </small>
          </div>
        </div>

        {/* Quick Stats */}
        <section className="college-quick-stats">
          <div>
            <span>
              EXAM READINESS
            </span>

            <strong>
              {loadingStats
                ? "..."
                : `${stats.accuracy}%`}
            </strong>
          </div>

          <div>
            <span>
              COURSES ACTIVE
            </span>

            <strong>
              —
            </strong>
          </div>

          <div>
            <span>
              QUIZZES COMPLETED
            </span>

            <strong>
              {loadingStats
                ? "..."
                : stats.quizzesCompleted}
            </strong>
          </div>

          <div>
            <span>
              TOTAL XP
            </span>

            <strong>
              {loadingStats
                ? "..."
                : stats.xp.toLocaleString()}
            </strong>
          </div>
        </section>

        {/* Workspace */}
        <section
          className="college-tools"
          id="tools"
        >
          <div className="college-section-heading">
            <div>
              <p className="college-label">
                YOUR WORKSPACE
              </p>

              <h2>
                Everything you need to learn.
              </h2>
            </div>
          </div>

          <div className="college-tools-grid">
            {tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <a
                  className="college-tool-card"
                  key={tool.title}
                  href={tool.href}
                >
                  <div className="college-tool-icon">
                    <Icon size={22} />
                  </div>

                  <h3>
                    {tool.title}
                  </h3>

                  <p>
                    {tool.description}
                  </p>

                  <span>
                    Open →
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        {/* Learning Roadmap */}
        <section
          className="college-roadmap"
          id="roadmap"
        >
          <div>
            <p className="college-label">
              MY LEARNING ROADMAP
            </p>

            <h2>
              Object-Oriented Programming
            </h2>

            <p>
              Continue through your personalized
              learning path based on your activity
              and performance.
            </p>
          </div>

          <div className="college-roadmap-list">
            <div className="roadmap-item complete">
              <span>01</span>

              <strong>
                Classes and Objects
              </strong>

              <small>
                Completed
              </small>
            </div>

            <div className="roadmap-item current">
              <span>02</span>

              <strong>
                Constructors
              </strong>

              <small>
                In progress
              </small>
            </div>

            <div className="roadmap-item">
              <span>03</span>

              <strong>
                Inheritance
              </strong>

              <small>
                Upcoming
              </small>
            </div>

            <div className="roadmap-item">
              <span>04</span>

              <strong>
                Polymorphism
              </strong>

              <small>
                Upcoming
              </small>
            </div>
          </div>
        </section>

        {/* Analytics */}
        <section
          className="college-bottom-grid"
          id="analytics"
        >
          <div className="college-panel">
            <div className="college-panel-heading">
              <div>
                <p className="college-label">
                  RECENT ACTIVITY
                </p>

                <h2>
                  Your performance
                </h2>
              </div>

              <BarChart3 size={21} />
            </div>

            <div className="college-progress-row">
              <span>
                Overall Accuracy
              </span>

              <strong>
                {loadingStats
                  ? "..."
                  : `${stats.accuracy}%`}
              </strong>
            </div>

            <div className="college-progress-track">
              <div
                style={{
                  width: `${stats.accuracy}%`,
                }}
              />
            </div>

            <div className="college-progress-row">
              <span>
                XP Progress
              </span>

              <strong>
                {loadingStats
                  ? "..."
                  : `${levelProgress}%`}
              </strong>
            </div>

            <div className="college-progress-track">
              <div
                style={{
                  width: `${levelProgress}%`,
                }}
              />
            </div>

            <div className="college-progress-row">
              <span>
                Challenges Completed
              </span>

              <strong>
                {loadingStats
                  ? "..."
                  : stats.quizzesCompleted}
              </strong>
            </div>

            <div className="college-progress-track">
              <div
                style={{
                  width:
                    stats.quizzesCompleted > 0
                      ? "100%"
                      : "0%",
                }}
              />
            </div>
          </div>

          <div className="college-panel">
            <div className="college-panel-heading">
              <div>
                <p className="college-label">
                  TODAY
                </p>

                <h2>
                  Study focus
                </h2>
              </div>

              <Target size={21} />
            </div>

            <a
              href="/college-student/programming"
              className="focus-card"
            >
              <FlaskConical size={22} />

              <div>
                <strong>
                  Continue Constructors
                </strong>

                <span>
                  Recommended practice
                </span>
              </div>
            </a>

            <a
              href="/college-student/mock-tests"
              className="focus-card"
            >
              <Trophy size={22} />

              <div>
                <strong>
                  Take a 10-question mock test
                </strong>

                <span>
                  Exam preparation
                </span>
              </div>
            </a>
          </div>
        </section>

        {/* Quick Links */}
        <section className="college-bottom-grid">
          <div className="college-panel">
            <div className="college-panel-heading">
              <div>
                <p className="college-label">
                  COURSEWORK
                </p>

                <h2>
                  Continue learning
                </h2>
              </div>

              <BookOpen size={21} />
            </div>

            <a
              href="/college-student/courses"
              className="focus-card"
            >
              <BookOpen size={22} />

              <div>
                <strong>
                  My Courses
                </strong>

                <span>
                  Open your learning workspace
                </span>
              </div>
            </a>

            <a
              href="/school-student/materials"
              className="focus-card"
            >
              <FileText size={22} />

              <div>
                <strong>
                  Learning Materials
                </strong>

                <span>
                  View shared educational resources
                </span>
              </div>
            </a>
          </div>

          <div className="college-panel">
            <div className="college-panel-heading">
              <div>
                <p className="college-label">
                  SKILL BUILDING
                </p>

                <h2>
                  Build practical skills
                </h2>
              </div>

              <Code2 size={21} />
            </div>

            <a
              href="/school-student/games"
              className="focus-card"
            >
              <Code2 size={22} />

              <div>
                <strong>
                  Programming Challenges
                </strong>

                <span>
                  Practice coding and problem solving
                </span>
              </div>
            </a>

            <a
              href="/college-student/analytics"
              className="focus-card"
            >
              <BarChart3 size={22} />

              <div>
                <strong>
                  Performance Analytics
                </strong>

                <span>
                  Understand your learning progress
                </span>
              </div>
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}