"use client";

import { use, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  LogOut,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Assignment = {
  id: string;
  class_id: number;
  title: string;
  description: string;
  due_date: string | null;
  max_points: number;
  created_at: string;
};

type Submission = {
  id: string;
  student_id: string;
  content: string;
  status: string;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
};

type StudentProfile = {
  user_id: string;
  full_name: string;
};

export default function TeacherAssignmentDetailsPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = use(params);

  const [teacherName, setTeacherName] = useState("Teacher");
  const [assignment, setAssignment] =
    useState<Assignment | null>(null);
  const [className, setClassName] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>(
    []
  );
  const [students, setStudents] = useState<
    Record<string, StudentProfile>
  >({});
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadAssignment() {
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

        const { data: assignmentData, error: assignmentError } =
          await supabase
            .from("assignments")
            .select(
              "id, class_id, title, description, due_date, max_points, created_at"
            )
            .eq("id", assignmentId)
            .eq("teacher_id", user.id)
            .single();

        if (assignmentError || !assignmentData) {
          console.error(
            "Could not load assignment:",
            assignmentError
          );
          window.location.href = "/teacher/assignments";
          return;
        }

        const loadedAssignment =
          assignmentData as Assignment;

        setAssignment(loadedAssignment);

        const { data: classData, error: classError } =
          await supabase
            .from("classes")
            .select("name, section, subject")
            .eq("id", loadedAssignment.class_id)
            .eq("teacher_id", user.id)
            .single();

        if (!classError && classData) {
          setClassName(
            `${classData.name} - Section ${classData.section} · ${classData.subject}`
          );
        }

        const { data: submissionData, error: submissionsError } =
          await supabase
            .from("submissions")
            .select(
              "id, student_id, content, status, score, feedback, submitted_at, graded_at"
            )
            .eq("assignment_id", assignmentId)
            .order("submitted_at", {
              ascending: false,
            });

        if (submissionsError) {
          console.error(
            "Could not load submissions:",
            submissionsError
          );
          setSubmissions([]);
          return;
        }

        const loadedSubmissions =
          (submissionData as Submission[]) || [];

        setSubmissions(loadedSubmissions);

        const studentIds = Array.from(
          new Set(
            loadedSubmissions.map(
              (submission) => submission.student_id
            )
          )
        );

        if (studentIds.length === 0) {
          return;
        }

        const {
          data: studentProfiles,
          error: studentsError,
        } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", studentIds);

        if (studentsError) {
          console.error(
            "Could not load student profiles:",
            studentsError
          );
          return;
        }

        const studentMap: Record<
          string,
          StudentProfile
        > = {};

        for (const student of studentProfiles || []) {
          studentMap[student.user_id] =
            student as StudentProfile;
        }

        setStudents(studentMap);
      } catch (error) {
        console.error(
          "Teacher assignment details error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadAssignment();
  }, [assignmentId]);

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

  function formatDate(value: string | null) {
    if (!value) {
      return "No due date";
    }

    return new Date(value).toLocaleString();
  }

  if (loading) {
    return (
      <main className="teacher-page">
        <section className="teacher-main">
          <p className="teacher-label">EDUQUEST</p>
          <h1>Loading assignment...</h1>
        </section>
      </main>
    );
  }

  if (!assignment) {
    return (
      <main className="teacher-page">
        <section className="teacher-main">
          <p className="teacher-label">EDUQUEST</p>
          <h1>Assignment not found.</h1>

          <a
            href="/teacher/assignments"
            className="teacher-view-button"
          >
            <ArrowLeft size={16} />
            Back to Assignments
          </a>
        </section>
      </main>
    );
  }

  const gradedCount = submissions.filter(
    (submission) => submission.status === "GRADED"
  ).length;

  const submittedCount = submissions.filter(
    (submission) => submission.status === "SUBMITTED"
  ).length;

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

      <section className="teacher-main">
        <a
          href="/teacher/assignments"
          className="back-button"
        >
          <ArrowLeft size={17} />
          Back to Assignments
        </a>

        <div className="teacher-welcome">
          <div>
            <p className="teacher-label">
              ASSIGNMENT DETAILS
            </p>

            <h1>{assignment.title}</h1>

            <p>
              {className || "Assigned class"}
            </p>
          </div>
        </div>

        <section className="teacher-overview">
          <div>
            <span>SUBMISSIONS</span>
            <strong>{submissions.length}</strong>
          </div>

          <div>
            <span>SUBMITTED</span>
            <strong>{submittedCount}</strong>
          </div>

          <div>
            <span>GRADED</span>
            <strong>{gradedCount}</strong>
          </div>

          <div>
            <span>MAX POINTS</span>
            <strong>{assignment.max_points}</strong>
          </div>
        </section>

        <section className="teacher-section">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                ASSIGNMENT
              </p>

              <h2>Assignment information</h2>
            </div>

            <FileText size={21} />
          </div>

          <div className="assignment-teacher-detail">
            <div className="assignment-teacher-meta">
              <div>
                <GraduationCap size={16} />
                <span>{className || "Class"}</span>
              </div>

              <div>
                <CalendarDays size={16} />
                <span>
                  Due: {formatDate(assignment.due_date)}
                </span>
              </div>
            </div>

            <div className="assignment-teacher-description">
              <p className="teacher-label">
                INSTRUCTIONS
              </p>

              <p>
                {assignment.description ||
                  "No description provided."}
              </p>
            </div>
          </div>
        </section>

        <section className="teacher-section">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                SUBMISSIONS
              </p>

              <h2>Student work</h2>
            </div>

            <UsersIcon />
          </div>

          {submissions.length === 0 ? (
            <div className="teacher-material-panel">
              <div>
                <strong>No submissions yet</strong>

                <p>
                  Students have not submitted work for this
                  assignment yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="teacher-submissions-list">
              {submissions.map((submission) => {
                const student =
                  students[submission.student_id];

                return (
                  <article
                    className="teacher-submission-card"
                    key={submission.id}
                  >
                    <div className="teacher-submission-header">
                      <div className="teacher-submission-student">
                        <div className="teacher-avatar">
                          {(student?.full_name || "S")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {student?.full_name ||
                              "Student"}
                          </strong>

                          <span>
                            Submitted{" "}
                            {new Date(
                              submission.submitted_at
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`submission-status ${
                          submission.status === "GRADED"
                            ? "graded"
                            : "submitted"
                        }`}
                      >
                        {submission.status === "GRADED" ? (
                          <>
                            <CheckCircle2 size={14} />
                            Graded
                          </>
                        ) : (
                          <>
                            <FileText size={14} />
                            Submitted
                          </>
                        )}
                      </div>
                    </div>

                    <div className="teacher-submission-content">
                      <p className="teacher-label">
                        STUDENT ANSWER
                      </p>

                      <div>
                        {submission.content}
                      </div>
                    </div>

                    <div className="teacher-submission-footer">
                      <div>
                        <span>Score</span>

                        <strong>
                          {submission.score !== null
                            ? `${submission.score} / ${assignment.max_points}`
                            : "Not graded"}
                        </strong>
                      </div>

                      <div>
                        <span>Feedback</span>

                        <strong>
                          {submission.feedback ||
                            "No feedback yet"}
                        </strong>
                      </div>

                      <a
                        href={`/teacher/assignments/${assignment.id}/submissions/${submission.id}`}
                        className="teacher-view-button"
                      >
                        Review Submission
                        <ArrowRightIcon />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function UsersIcon() {
  return (
    <User size={21} />
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}