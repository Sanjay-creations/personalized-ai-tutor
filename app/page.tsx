"use client";

import { useState } from "react";
import {
  ArrowRight,
  Brain,
  Gamepad2,
  GraduationCap,
  Sparkles,
  Target,
  Trophy,
  Users,
  CheckCircle2,
} from "lucide-react";

import ThemeToggle from "@/components/ThemeToggle";

const roles = [
  {
    title: "School Student",
    description:
      "Learn through games, AI, quizzes, stories and challenges.",
    icon: GraduationCap,
  },
  {
    title: "College Student",
    description:
      "Study smarter with AI, mock tests, roadmaps and analytics.",
    icon: Brain,
  },
  {
    title: "Teacher",
    description:
      "Manage classes, materials, assignments and student progress.",
    icon: Users,
  },
];

const features = [
  {
    icon: Brain,
    title: "AI Learning Assistant",
    description:
      "Understand difficult concepts with explanations, examples, summaries and practice.",
  },
  {
    icon: Gamepad2,
    title: "Learn Through Games",
    description:
      "Choose games, quizzes and challenges that match the way you like to learn.",
  },
  {
    icon: Target,
    title: "Personalized Learning",
    description:
      "Build learning roadmaps and discover what to practice next.",
  },
  {
    icon: Trophy,
    title: "Track Your Growth",
    description:
      "Earn XP, points, streaks and achievements while improving your skills.",
  },
];

export default function Home() {
  const [selectedRole, setSelectedRole] = useState("");

  function handleRoleSelection(roleTitle: string) {
    setSelectedRole(roleTitle);

    if (roleTitle === "School Student") {
      window.location.href = "/signup?role=SCHOOL_STUDENT";
      return;
    }

    if (roleTitle === "College Student") {
      window.location.href = "/signup?role=COLLEGE_STUDENT";
      return;
    }

    if (roleTitle === "Teacher") {
      window.location.href = "/login";
    }
  }

  return (
    <main className="eduquest-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={22} />
          </div>

          <span>EDUQUEST</span>
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#roles">Who It's For</a>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        <button
          className="nav-button"
          onClick={() =>
            document
              .getElementById("roles")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Get Started
          <ArrowRight size={17} />
        </button>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="hero-content">
          <div className="eyebrow">
            <Sparkles size={16} />
            AI-POWERED • GAMIFIED • PERSONALIZED
          </div>

          <h1>
            Learn Your Way.
            <br />
            <span>Play to Understand.</span>
          </h1>

          <p className="hero-description">
            EDUQUEST brings AI learning, games, quizzes, personalized study
            plans and performance tracking together in one learning ecosystem.
          </p>

          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() =>
                document
                  .getElementById("roles")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Start Your Journey
              <ArrowRight size={19} />
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore EDUQUEST
            </button>
          </div>

          <div className="hero-points">
            <span>
              <CheckCircle2 size={17} />
              Learn differently
            </span>

            <span>
              <CheckCircle2 size={17} />
              Practice intelligently
            </span>

            <span>
              <CheckCircle2 size={17} />
              Grow continuously
            </span>
          </div>
        </div>

        {/* Hero visual */}
        <div className="hero-visual">
          <div className="floating-card card-top">
            <Brain size={20} />

            <div>
              <strong>AI Tutor</strong>
              <small>Ready to help</small>
            </div>
          </div>

          <div className="quest-card">
            <div className="quest-card-header">
              <span>YOUR LEARNING QUEST</span>
              <span className="live-dot">● LIVE</span>
            </div>

            <div className="quest-icon">
              <Sparkles size={42} />
            </div>

            <h3>What will you learn today?</h3>

            <p>
              Choose a topic, learning style or challenge and start your next
              learning adventure.
            </p>

            <div className="quest-progress">
              <div>
                <span>Today's progress</span>
                <strong>68%</strong>
              </div>

              <div className="progress-track">
                <div className="progress-value" />
              </div>
            </div>

            <div className="quest-stats">
              <div>
                <strong>1,240</strong>
                <span>XP</span>
              </div>

              <div>
                <strong>7</strong>
                <span>Day streak</span>
              </div>

              <div>
                <strong>24</strong>
                <span>Challenges</span>
              </div>
            </div>
          </div>

          <div className="floating-card card-bottom">
            <Gamepad2 size={20} />

            <div>
              <strong>Game Challenge</strong>
              <small>Concept Puzzle</small>
            </div>
          </div>
        </div>
      </section>

      {/* Role selection */}
      <section className="roles-section" id="roles">
        <div className="section-heading">
          <span className="section-label">
            CHOOSE YOUR EXPERIENCE
          </span>

          <h2>Who are you?</h2>

          <p>
            EDUQUEST provides a different experience for students, teachers
            and learning communities.
          </p>
        </div>

        <div className="roles-grid">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected =
              selectedRole === role.title;

            return (
              <button
                key={role.title}
                className={`role-card ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() =>
                  handleRoleSelection(role.title)
                }
              >
                <div className="role-icon">
                  <Icon size={28} />
                </div>

                <h3>{role.title}</h3>

                <p>{role.description}</p>

                <span>
                  Continue
                  <ArrowRight size={17} />
                </span>
              </button>
            );
          })}
        </div>

        {selectedRole && (
          <div className="selection-message">
            <CheckCircle2 size={20} />

            <span>
              You selected{" "}
              <strong>{selectedRole}</strong>. Redirecting
              you to the appropriate account page...
            </span>
          </div>
        )}
      </section>

      {/* Features */}
      <section
        className="features-section"
        id="features"
      >
        <div className="section-heading">
          <span className="section-label">
            THE EDUQUEST ECOSYSTEM
          </span>

          <h2>More than a learning platform.</h2>

          <p>
            AI tutor + game platform + study planner + exam preparation +
            progress tracking.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                className="feature-card"
                key={feature.title}
              >
                <div className="feature-icon">
                  <Icon size={25} />
                </div>

                <h3>{feature.title}</h3>

                <p>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section
        className="how-section"
        id="how-it-works"
      >
        <div className="section-heading">
          <span className="section-label">
            HOW IT WORKS
          </span>

          <h2>Your learning journey.</h2>

          <p>
            Learn, practice, play and improve — with the freedom to choose how
            you learn.
          </p>
        </div>

        <div className="journey">
          <div className="journey-step">
            <span>01</span>
            <Sparkles size={26} />

            <h3>Choose</h3>

            <p>
              Choose your subject, topic and preferred learning method.
            </p>
          </div>

          <div className="journey-line" />

          <div className="journey-step">
            <span>02</span>
            <Brain size={26} />

            <h3>Learn</h3>

            <p>
              Learn concepts with AI explanations, materials and examples.
            </p>
          </div>

          <div className="journey-line" />

          <div className="journey-step">
            <span>03</span>
            <Gamepad2 size={26} />

            <h3>Play</h3>

            <p>
              Practice your knowledge through quizzes and learning games.
            </p>
          </div>

          <div className="journey-line" />

          <div className="journey-step">
            <span>04</span>
            <Trophy size={26} />

            <h3>Grow</h3>

            <p>
              Track your progress and keep improving with every challenge.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="final-cta-inner">
          <div>
            <span className="section-label">
              YOUR NEXT ADVENTURE STARTS HERE
            </span>

            <h2>Make learning feel like a journey.</h2>

            <p>
              Learn your way. Play to understand. Grow with every challenge.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              document
                .getElementById("roles")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Get Started
            <ArrowRight size={19} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>

          <span>EDUQUEST</span>
        </div>

        <p>
          LEARN YOUR WAY. PLAY TO UNDERSTAND. GROW WITH EVERY CHALLENGE.
        </p>

        <span className="copyright">
          © 2026 EDUQUEST
        </span>
      </footer>
    </main>
  );
}