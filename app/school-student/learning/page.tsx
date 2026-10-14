"use client";

import { ArrowLeft, BookOpen, PlayCircle, Target } from "lucide-react";

export default function LearningPage() {
  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a href="/school-student" className="back-button">
          <ArrowLeft size={17} />
          Back to Dashboard
        </a>

        <div className="dashboard-brand">
          <div className="dashboard-logo">
            <BookOpen size={21} />
          </div>
          <span>EDUQUEST</span>
        </div>

        <div className="student-profile">
          <div className="avatar">S</div>
          <span>Student</span>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="welcome">
          <p className="dashboard-label">MY LEARNING</p>

          <h1>
            Continue your
            <span> learning journey.</span>
          </h1>

          <p>
            Choose a subject and start learning. Your courses, topics and
            future progress will appear here.
          </p>
        </div>

        <div className="dashboard-grid">
          <button className="dashboard-card">
            <div className="dashboard-card-icon">
              <BookOpen size={25} />
            </div>

            <h2>My Subjects</h2>

            <p>
              Explore the subjects you're currently learning and discover
              topics to study.
            </p>

            <span>Explore Subjects →</span>
          </button>

          <button className="dashboard-card">
            <div className="dashboard-card-icon">
              <PlayCircle size={25} />
            </div>

            <h2>Continue Learning</h2>

            <p>
              Pick up where you left off and continue your latest learning
              activity.
            </p>

            <span>Continue →</span>
          </button>

          <button className="dashboard-card">
            <div className="dashboard-card-icon">
              <Target size={25} />
            </div>

            <h2>Learning Goals</h2>

            <p>
              Set goals for your learning journey and work towards improving
              every day.
            </p>

            <span>View Goals →</span>
          </button>
        </div>
      </section>
    </main>
  );
}