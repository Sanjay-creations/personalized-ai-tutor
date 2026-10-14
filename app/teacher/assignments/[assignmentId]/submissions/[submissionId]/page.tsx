"use client";

import { FormEvent, use, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  LogOut,
  Save,
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
};

type Submission = {
  id: string;
  assignment_id: string;
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

type ClassDetails = {
  id: number;
  name: string;
  subject: string;
  section: string;
};

export default function ReviewSubmissionPage({
  params,
}: {
  params: Promise<{
    assignmentId: string;
    submissionId: string;
  }>;
}) {
  const { assignmentId, submissionId } = use(params);

  const [teacherName, setTeacherName] = useState("Teacher");
  const [assignment, setAssignment] =
    useState<Assignment | null>(null);
  const [submission, setSubmission] =
    useState<Submission | null>(null);
  const [student, setStudent] =
    useState<StudentProfile | null>(null);
  const [classDetails, setClassDetails] =
    useState<ClassDetails | null>(null);

  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadSubmission() {
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
              "id, class_id, title, description, due_date, max_points"
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
            .select("id, name, subject, section")
            .eq("id", loadedAssignment.class_id)
            .eq("teacher_id", user.id)
            .single();

        if (classError || !classData) {
          console.error(
            "Could not load class:",
            classError
          );
          window.location.href = "/teacher/assignments";
          return;
        }

        setClassDetails(classData as ClassDetails);

        const {
          data: submissionData,
          error: submissionError,
        } = await supabase
          .from("submissions")
          .select(
            "id, assignment_id, student_id, content, status, score, feedback, submitted_at, graded_at"
          )
          .eq("id", submissionId)
          .eq("assignment_id", assignmentId)
          .single();

        if (submissionError || !submissionData) {
          console.error(
            "Could not load submission:",
            submissionError
          );
          window.location.href =
            `/teacher/assignments/${assignmentId}`;
          return;
        }

        const loadedSubmission =
          submissionData as Submission;

        setSubmission(loadedSubmission);
        setScore(
          loadedSubmission.score !== null
            ? String(loadedSubmission.score)
            : ""
        );
        setFeedback(
          loadedSubmission.feedback || ""
        );

        const { data: studentData, error: studentError } =
          await supabase
            .from("profiles")
            .select("user_id, full_name")
            .eq("user_id", loadedSubmission.student_id)
            .single();

        if (studentError || !studentData) {
          console.error(
            "Could not load student:",
            studentError
          );
        } else {
          setStudent(
            studentData as StudentProfile
          );
        }
      } catch (error) {
        console.error(
          "Review submission error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadSubmission();
  }, [assignmentId, submissionId]);

  async function handleGrade(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!assignment || !submission) {
      return;
    }

    const numericScore = Number(score);

    if (!Number.isFinite(numericScore)) {
      setMessage("Please enter a valid score.");
      return;
    }

    if (
      numericScore < 0 ||
      numericScore > assignment.max_points
    ) {
      setMessage(
        `Score must be between 0 and ${assignment.max_points}.`
      );
      return;
    }

    setMessage("");
    setSaving(true);

    try {
      const { data: updatedSubmission, error } =
        await supabase
          .from("submissions")
          .update({
            score: numericScore,
            feedback: feedback.trim() || null,
            status: "GRADED",
            graded_at: new Date().toISOString(),
          })
          .eq("id", submission.id)
          .eq("assignment_id", assignment.id)
          .select(
            "id, assignment_id, student_id, content, status, score, feedback, submitted_at, graded_at"
          )
          .single();

      if (error) {
        console.error(
          "Could not grade submission:",
          error
        );
        setMessage(error.message);
        return;
      }

      setSubmission(
        updatedSubmission as Submission
      );

      setMessage(
        "Submission graded successfully."
      );
    } catch (error) {
      console.error(
        "Grading error:",
        error
      );
      setMessage(
        "Something went wrong while saving the grade."
      );
    } finally {
      setSaving(false);
    }
  }

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

  if (loading) {
    return (
      <main className="teacher-page">
        <section className="teacher-main">
          <p className="teacher-label">EDUQUEST</p>
          <h1>Loading submission...</h1>
        </section>
      </main>
    );
  }

  if (!assignment || !submission) {
    return (
      <main className="teacher-page">
        <section className="teacher-main">
          <p className="teacher-label">EDUQUEST</p>
          <h1>Submission not found.</h1>

          <a
            href={`/teacher/assignments/${assignmentId}`}
            className="teacher-view-button"
          >
            <ArrowLeft size={16} />
            Back to Assignment
          </a>
        </section>
      </main>
    );
  }

  const isGraded =
    submission.status === "GRADED";

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
          href={`/teacher/assignments/${assignmentId}`}
          className="back-button"
        >
          <ArrowLeft size={17} />
          Back to Assignment
        </a>

        <div className="teacher-welcome">
          <div>
            <p className="teacher-label">
              REVIEW SUBMISSION
            </p>

            <h1>
              {student?.full_name || "Student"}
            </h1>

            <p>
              {assignment.title}
              {classDetails
                ? ` · ${classDetails.name} - Section ${classDetails.section}`
                : ""}
            </p>
          </div>
        </div>

        <section className="teacher-overview">
          <div>
            <span>MAX POINTS</span>
            <strong>{assignment.max_points}</strong>
          </div>

          <div>
            <span>CURRENT SCORE</span>
            <strong>
              {submission.score !== null
                ? submission.score
                : "—"}
            </strong>
          </div>

          <div>
            <span>STATUS</span>
            <strong>
              {isGraded ? "Graded" : "Submitted"}
            </strong>
          </div>

          <div>
            <span>SUBMITTED</span>
            <strong>
              {new Date(
                submission.submitted_at
              ).toLocaleDateString()}
            </strong>
          </div>
        </section>

        <section className="teacher-section">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                STUDENT WORK
              </p>

              <h2>Submitted answer</h2>
            </div>

            <User size={21} />
          </div>

          <div className="teacher-submission-content teacher-review-content">
            <div>
              {submission.content}
            </div>
          </div>
        </section>

        <section className="teacher-section">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                GRADING
              </p>

              <h2>
                {isGraded
                  ? "Grade and feedback"
                  : "Review and grade"}
              </h2>
            </div>

            <CheckCircle2 size={21} />
          </div>

          <form
            className="grade-form"
            onSubmit={handleGrade}
          >
            <div className="grade-score-section">
              <label htmlFor="score">
                Score
              </label>

              <div className="grade-score-input">
                <input
                  id="score"
                  type="number"
                  min="0"
                  max={assignment.max_points}
                  step="1"
                  value={score}
                  onChange={(event) =>
                    setScore(event.target.value)
                  }
                  placeholder="0"
                />

                <span>
                  / {assignment.max_points}
                </span>
              </div>
            </div>

            <div className="assignment-field">
              <label htmlFor="feedback">
                Feedback for student
              </label>

              <textarea
                id="feedback"
                value={feedback}
                onChange={(event) =>
                  setFeedback(event.target.value)
                }
                placeholder="Write helpful feedback for the student..."
                rows={7}
              />
            </div>

            {message && (
              <div className="assignment-message">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="teacher-action-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="spin"
                  />
                  Saving Grade...
                </>
              ) : (
                <>
                  <Save size={17} />
                  {isGraded
                    ? "Update Grade"
                    : "Save Grade"}
                </>
              )}
            </button>
          </form>
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
                <span>
                  {classDetails
                    ? `${classDetails.name} - Section ${classDetails.section}`
                    : "Class"}
                </span>
              </div>

              <div>
                <CalendarDays size={16} />
                <span>
                  Due:{" "}
                  {assignment.due_date
                    ? new Date(
                        assignment.due_date
                      ).toLocaleString()
                    : "No due date"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}