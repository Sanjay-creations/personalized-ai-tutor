"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  Loader2,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type StudentClassMembership = {
  class_id: number;
};

type Assignment = {
  id: string;
  class_id: number;
  title: string;
  description: string;
  due_date: string | null;
  max_points: number;
  created_at: string;
};

export default function StudentAssignmentsPage() {
  const [studentName, setStudentName] = useState("Student");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadAssignments() {
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
            "Could not load student profile:",
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
          setAssignments([]);
          return;
        }

        const classIds = (
          (memberships as StudentClassMembership[]) || []
        ).map((membership) => membership.class_id);

        if (classIds.length === 0) {
          setAssignments([]);
          return;
        }

        const {
          data: studentAssignments,
          error: assignmentsError,
        } = await supabase
          .from("assignments")
          .select(
            "id, class_id, title, description, due_date, max_points, created_at"
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
          setAssignments([]);
          return;
        }

        setAssignments(
          (studentAssignments as Assignment[]) || []
        );
      } catch (error) {
        console.error(
          "Student assignments error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadAssignments();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
      return;
    }

    window.location.href = "/login";
  }

  function formatDueDate(dueDate: string | null) {
    if (!dueDate) {
      return "No due date";
    }

    return new Date(dueDate).toLocaleString();
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-content">
          <p className="dashboard-label">EDUQUEST</p>
          <h1>Loading your assignments...</h1>
        </section>
      </main>
    );
  }

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
            <FileText size={21} />
          </div>

          <span>EDUQUEST</span>
        </div>

        <div className="student-profile">
          <div className="avatar">
            {studentName.charAt(0).toUpperCase()}
          </div>

          <span>{studentName}</span>

          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <Loader2
                size={15}
                className="spin"
              />
            ) : (
              <LogOut size={15} />
            )}

            {loggingOut
              ? "Signing Out..."
              : "Sign Out"}
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="welcome">
          <p className="dashboard-label">
            ASSIGNMENTS
          </p>

          <h1>
            Your learning
            <span> tasks.</span>
          </h1>

          <p>
            View assignments from the classes you are
            enrolled in and keep track of your upcoming work.
          </p>
        </div>

        {assignments.length === 0 ? (
          <section className="progress-panel">
            <div className="progress-panel-heading">
              <div>
                <p className="dashboard-label">
                  ASSIGNMENTS
                </p>

                <h2>No assignments yet</h2>
              </div>

              <BookOpen size={20} />
            </div>

            <p
              style={{
                marginTop: "15px",
                color: "#778398",
                fontSize: "11px",
                lineHeight: 1.7,
              }}
            >
              Your teacher will post assignments here
              when work is assigned to your class.
            </p>
          </section>
        ) : (
          <div className="assignment-student-grid">
            {assignments.map((assignment) => (
              <article
                className="student-assignment-card"
                key={assignment.id}
              >
                <div className="student-assignment-top">
                  <div className="student-assignment-icon">
                    <FileText size={22} />
                  </div>

                  <span>
                    {assignment.max_points} points
                  </span>
                </div>

                <h2>{assignment.title}</h2>

                <p>
                  {assignment.description ||
                    "No description provided."}
                </p>

                <div className="student-assignment-meta">
                  <div>
                    <CalendarDays size={15} />

                    <span>
                      {formatDueDate(
                        assignment.due_date
                      )}
                    </span>
                  </div>

                  <div>
                    <GraduationCap size={15} />

                    <span>
                      Class assignment
                    </span>
                  </div>
                </div>

                <button className="primary-button">
                  Open Assignment →
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}