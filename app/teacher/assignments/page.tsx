"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FileText,
  GraduationCap,
  LogOut,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type TeacherAssignment = {
  id: string;
  class_id: number;
  title: string;
  description: string;
  due_date: string | null;
  max_points: number;
  created_at: string;
};

type TeacherClass = {
  id: number;
  name: string;
  subject: string;
  section: string;
};

export default function TeacherAssignmentsPage() {
  const [teacherName, setTeacherName] = useState("Teacher");
  const [assignments, setAssignments] = useState<TeacherAssignment[]>(
    []
  );
  const [classes, setClasses] = useState<TeacherClass[]>([]);
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

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("user_id", user.id)
          .single();

        if (profileError || !profile) {
          console.error(
            "Could not load teacher profile:",
            profileError
          );
          window.location.href = "/login";
          return;
        }

        if (
          profile.role !== "SCHOOL_TEACHER" &&
          profile.role !== "COLLEGE_TEACHER"
        ) {
          window.location.href = "/";
          return;
        }

        setTeacherName(profile.full_name || "Teacher");

        const { data: teacherClasses, error: classesError } =
          await supabase
            .from("classes")
            .select("id, name, subject, section")
            .eq("teacher_id", user.id)
            .order("created_at", {
              ascending: true,
            });

        if (classesError) {
          console.error(
            "Could not load teacher classes:",
            classesError
          );
          setClasses([]);
        } else {
          setClasses((teacherClasses as TeacherClass[]) || []);
        }

        const { data: teacherAssignments, error: assignmentsError } =
          await supabase
            .from("assignments")
            .select(
              "id, class_id, title, description, due_date, max_points, created_at"
            )
            .eq("teacher_id", user.id)
            .order("created_at", {
              ascending: false,
            });

        if (assignmentsError) {
          console.error(
            "Could not load teacher assignments:",
            assignmentsError
          );
          setAssignments([]);
          return;
        }

        setAssignments(
          (teacherAssignments as TeacherAssignment[]) || []
        );
      } catch (error) {
        console.error(
          "Teacher assignments error:",
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

  function getClassLabel(classId: number) {
    const teacherClass = classes.find(
      (item) => item.id === classId
    );

    if (!teacherClass) {
      return "Class";
    }

    return `${teacherClass.name} - Section ${teacherClass.section}`;
  }

  function formatDueDate(dueDate: string | null) {
    if (!dueDate) {
      return "No due date";
    }

    return new Date(dueDate).toLocaleString();
  }

  if (loading) {
    return (
      <main className="teacher-page">
        <section className="teacher-main">
          <p className="teacher-label">EDUQUEST</p>
          <h1>Loading assignments...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="teacher-page">
      <header className="teacher-header">
        <a href="/" className="teacher-brand">
          <div className="teacher-logo">
            <GraduationCap size={20} />
          </div>

          <span>EDUQUEST</span>
        </a>

        <div className="teacher-user">
          <div className="teacher-avatar">
            {teacherName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{teacherName}</strong>
            <span>Teacher</span>
          </div>

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

      <section className="teacher-main">
        <a
          href="/teacher"
          className="back-button"
        >
          <ArrowLeft size={17} />
          Back to Teacher Dashboard
        </a>

        <div className="teacher-welcome">
          <div>
            <p className="teacher-label">
              ASSIGNMENTS
            </p>

            <h1>
              Manage your
              <span> assignments.</span>
            </h1>

            <p>
              View, manage and review assignments created
              for your assigned classes.
            </p>
          </div>

          <a
            href="/teacher/assignments/new"
            className="teacher-action-button"
          >
            <Plus size={17} />
            New Assignment
          </a>
        </div>

        <section className="teacher-overview">
          <div>
            <span>TOTAL ASSIGNMENTS</span>
            <strong>{assignments.length}</strong>
          </div>

          <div>
            <span>ASSIGNED CLASSES</span>
            <strong>{classes.length}</strong>
          </div>

          <div>
            <span>ACTIVE</span>
            <strong>{assignments.length}</strong>
          </div>

          <div>
            <span>COMPLETED</span>
            <strong>0</strong>
          </div>
        </section>

        <section className="teacher-section">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                YOUR ASSIGNMENTS
              </p>

              <h2>Created assignments</h2>
            </div>

            <FileText size={21} />
          </div>

          {assignments.length === 0 ? (
            <div className="teacher-material-panel">
              <div>
                <strong>
                  No assignments created yet
                </strong>

                <p>
                  Create your first assignment for one of
                  your assigned classes.
                </p>
              </div>

              <a
                href="/teacher/assignments/new"
                className="teacher-action-button"
              >
                <Plus size={17} />
                Create Assignment
              </a>
            </div>
          ) : (
            <div className="teacher-assignment-grid">
              {assignments.map((assignment) => (
                <article
                  className="teacher-assignment-card"
                  key={assignment.id}
                >
                  <div className="teacher-assignment-top">
                    <div className="teacher-class-icon">
                      <FileText size={22} />
                    </div>

                    <span>
                      {assignment.max_points} points
                    </span>
                  </div>

                  <h3>{assignment.title}</h3>

                  <p className="teacher-assignment-description">
                    {assignment.description ||
                      "No description provided."}
                  </p>

                  <div className="teacher-assignment-meta">
                    <div>
                      <GraduationCap size={15} />

                      <span>
                        {getClassLabel(
                          assignment.class_id
                        )}
                      </span>
                    </div>

                    <div>
                      <CalendarDays size={15} />

                      <span>
                        {formatDueDate(
                          assignment.due_date
                        )}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`/teacher/assignments/${assignment.id}`}
                    className="teacher-view-button"
                  >
                    View Assignment
                    <ArrowRight size={16} />
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}