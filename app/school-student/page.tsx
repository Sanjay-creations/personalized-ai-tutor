"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  FileText,
  Gamepad2,
  LogOut,
  Target,
  Trophy,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

type Assignment = {
  id: string;
  class_id: number;
  title: string;
  due_date: string | null;
};

type Submission = {
  assignment_id: string;
  status: string;
};

export default function SchoolStudent() {
  const [studentName, setStudentName] =
    useState("Student");

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [assignmentCount, setAssignmentCount] =
    useState(0);

  const [submittedCount, setSubmittedCount] =
    useState(0);

  const [pendingAssignments, setPendingAssignments] =
    useState(0);

  const [loadingAssignments, setLoadingAssignments] =
    useState(true);

  // ----------------------------------------
  // LOAD STUDENT DATA
  // ----------------------------------------

  useEffect(() => {
    async function loadStudentData() {
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
            "Could not load profile:",
            profileError
          );

          window.location.href = "/login";
          return;
        }

        if (
          profile.role !==
          "SCHOOL_STUDENT"
        ) {
          window.location.href = "/";
          return;
        }

        setStudentName(
          profile.full_name || "Student"
        );

        const {
          data: memberships,
          error: membershipsError,
        } = await supabase
          .from("class_members")
          .select("class_id")
          .eq("student_id", user.id);

        if (membershipsError) {
          console.error(
            "Could not load class memberships:",
            membershipsError
          );

          return;
        }

        const classIds = (
          memberships || []
        ).map(
          (membership) =>
            membership.class_id
        );

        if (classIds.length === 0) {
          setAssignmentCount(0);
          setSubmittedCount(0);
          setPendingAssignments(0);
          return;
        }

        const {
          data: assignmentData,
          error: assignmentsError,
        } = await supabase
          .from("assignments")
          .select(
            "id, class_id, title, due_date"
          )
          .in("class_id", classIds)
          .order("created_at", {
            ascending: false,
          });

        if (assignmentsError) {
          console.error(
            "Could not load assignments:",
            assignmentsError
          );

          return;
        }

        const assignments =
          (assignmentData as Assignment[]) ||
          [];

        setAssignmentCount(
          assignments.length
        );

        if (assignments.length === 0) {
          setSubmittedCount(0);
          setPendingAssignments(0);
          return;
        }

        const assignmentIds =
          assignments.map(
            (assignment) =>
              assignment.id
          );

        const {
          data: submissionData,
          error: submissionsError,
        } = await supabase
          .from("submissions")
          .select(
            "assignment_id, status"
          )
          .eq("student_id", user.id)
          .in(
            "assignment_id",
            assignmentIds
          );

        if (submissionsError) {
          console.error(
            "Could not load submissions:",
            submissionsError
          );

          return;
        }

        const submissions =
          (submissionData as Submission[]) ||
          [];

        const submittedAssignmentIds =
          new Set(
            submissions.map(
              (submission) =>
                submission.assignment_id
            )
          );

        setSubmittedCount(
          submittedAssignmentIds.size
        );

        setPendingAssignments(
          Math.max(
            assignments.length -
              submittedAssignmentIds.size,
            0
          )
        );
      } catch (error) {
        console.error(
          "School student dashboard error:",
          error
        );
      } finally {
        setCheckingAccess(false);
        setLoadingAssignments(false);
      }
    }

    loadStudentData();
  }, []);

  // ----------------------------------------
  // LOGOUT
  // ----------------------------------------

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

  // ----------------------------------------
  // LOADING
  // ----------------------------------------

  if (checkingAccess) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-content">
          <p className="dashboard-label">
            EDUQUEST
          </p>

          <h1>
            Loading your learning space...
          </h1>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a
          href="/"
          className="back-button"
        >
          <ArrowLeft size={17} />
          Back to EDUQUEST
        </a>

        <div className="dashboard-brand">
          <div className="dashboard-logo">
            <Brain size={21} />
          </div>

          <span>EDUQUEST</span>
        </div>

        <div className="student-profile">
          <div className="avatar">
            {studentName
              .charAt(0)
              .toUpperCase()}
          </div>

          <span>
            {studentName}
          </span>

          {/* GLOBAL THEME TOGGLE */}
          <ThemeToggle />

          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={15} />

            {loggingOut
              ? "Signing Out..."
              : "Sign Out"}
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="welcome">
          <p className="dashboard-label">
            SCHOOL STUDENT
          </p>

          <h1>
            Welcome to your
            <span>
              {" "}
              learning quest.
            </span>
          </h1>

          <p>
            Learn, practice, play and track
            your progress — all from one place.
          </p>
        </div>

        {/* ASSIGNMENT SUMMARY */}
        <section className="student-assignment-summary">
          <div className="student-assignment-summary-heading">
            <div>
              <p className="dashboard-label">
                MY ASSIGNMENTS
              </p>

              <h2>
                Stay on top of your work.
              </h2>
            </div>

            <FileText size={22} />
          </div>

          <div className="student-assignment-summary-grid">
            <div>
              <span>ASSIGNED</span>

              <strong>
                {loadingAssignments
                  ? "..."
                  : assignmentCount}
              </strong>
            </div>

            <div>
              <span>SUBMITTED</span>

              <strong>
                {loadingAssignments
                  ? "..."
                  : submittedCount}
              </strong>
            </div>

            <div>
              <span>TO DO</span>

              <strong>
                {loadingAssignments
                  ? "..."
                  : pendingAssignments}
              </strong>
            </div>

            <a
              href="/school-student/assignments"
              className="student-assignment-summary-action"
            >
              Open Assignments →
            </a>
          </div>
        </section>

        {/* DASHBOARD CARDS */}
        <div className="dashboard-grid">
          <a
            href="/school-student/learning"
            className="dashboard-card"
          >
            <div className="dashboard-card-icon">
              <BookOpen size={25} />
            </div>

            <h2>
              My Learning
            </h2>

            <p>
              Continue learning your subjects
              and explore new topics.
            </p>

            <span>
              Start Learning →
            </span>
          </a>

          <a
            href="/school-student/ai-tutor"
            className="dashboard-card"
          >
            <div className="dashboard-card-icon">
              <Brain size={25} />
            </div>

            <h2>
              AI Tutor
            </h2>

            <p>
              Ask questions and get help
              understanding difficult concepts.
            </p>

            <span>
              Open AI Tutor →
            </span>
          </a>

          <a
            href="/school-student/games"
            className="dashboard-card"
          >
            <div className="dashboard-card-icon">
              <Gamepad2 size={25} />
            </div>

            <h2>
              Learning Games
            </h2>

            <p>
              Practice what you know through
              fun educational challenges.
            </p>

            <span>
              Play Now →
            </span>
          </a>

          <a
            href="/school-student/progress"
            className="dashboard-card"
          >
            <div className="dashboard-card-icon">
              <Target size={25} />
            </div>

            <h2>
              My Progress
            </h2>

            <p>
              See your learning progress,
              activity and areas to improve.
            </p>

            <span>
              View Progress →
            </span>
          </a>

          <a
            href="/school-student/achievements"
            className="dashboard-card"
          >
            <div className="dashboard-card-icon">
              <Trophy size={25} />
            </div>

            <h2>
              Achievements
            </h2>

            <p>
              View your XP, streaks, badges
              and learning achievements.
            </p>

            <span>
              View Achievements →
            </span>
          </a>

          <a
            href="/school-student/materials"
            className="dashboard-card"
          >
            <div className="dashboard-card-icon">
              <BookOpen size={25} />
            </div>

            <h2>
              Learning Materials
            </h2>

            <p>
              Access notes, PDFs, presentations
              and resources shared by your teachers.
            </p>

            <span>
              View Materials →
            </span>
          </a>
        </div>
      </section>
    </main>
  );
}