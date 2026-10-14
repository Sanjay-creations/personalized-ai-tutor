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
  Send,
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

type ExistingSubmission = {
  id: string;
  content: string;
  status: string;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
};

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = use(params);

  const [studentName, setStudentName] = useState("Student");
  const [assignment, setAssignment] =
    useState<Assignment | null>(null);
  const [submission, setSubmission] =
    useState<ExistingSubmission | null>(null);

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");

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

        const { data: assignmentData, error: assignmentError } =
          await supabase
            .from("assignments")
            .select(
              "id, class_id, title, description, due_date, max_points"
            )
            .eq("id", assignmentId)
            .single();

        if (assignmentError || !assignmentData) {
          console.error(
            "Could not load assignment:",
            assignmentError
          );
          window.location.href = "/school-student/assignments";
          return;
        }

        // Verify that this student belongs to the assignment's class.
        const { data: membership, error: membershipError } =
          await supabase
            .from("class_members")
            .select("class_id")
            .eq("class_id", assignmentData.class_id)
            .eq("student_id", user.id)
            .single();

        if (membershipError || !membership) {
          console.error(
            "Student is not enrolled in this assignment class:",
            membershipError
          );
          window.location.href = "/school-student/assignments";
          return;
        }

        setAssignment(assignmentData as Assignment);

        // Check whether the student already submitted this assignment.
        const {
          data: existingSubmission,
          error: submissionError,
        } = await supabase
          .from("submissions")
          .select(
            "id, content, status, score, feedback, submitted_at, graded_at"
          )
          .eq("assignment_id", assignmentId)
          .eq("student_id", user.id)
          .maybeSingle();

        if (submissionError) {
          console.error(
            "Could not load existing submission:",
            submissionError
          );
        }

        if (existingSubmission) {
          const existing =
            existingSubmission as ExistingSubmission;

          setSubmission(existing);
          setContent(existing.content || "");
        }
      } catch (error) {
        console.error(
          "Assignment detail error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadAssignment();
  }, [assignmentId]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!content.trim()) {
      setMessage("Please enter your answer before submitting.");
      return;
    }

    setMessage("");
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      if (!assignment) {
        setMessage("Assignment could not be loaded.");
        return;
      }

      if (submission) {
        const { data: updatedSubmission, error } =
          await supabase
            .from("submissions")
            .update({
              content: content.trim(),
              status: "SUBMITTED",
              submitted_at: new Date().toISOString(),
              score: null,
              feedback: null,
              graded_at: null,
            })
            .eq("id", submission.id)
            .eq("student_id", user.id)
            .select(
              "id, content, status, score, feedback, submitted_at, graded_at"
            )
            .single();

        if (error) {
          console.error(
            "Could not update submission:",
            error
          );
          setMessage(error.message);
          return;
        }

        setSubmission(
          updatedSubmission as ExistingSubmission
        );
        setMessage("Your submission was updated successfully.");
      } else {
        const { data: newSubmission, error } =
          await supabase
            .from("submissions")
            .insert({
              assignment_id: assignment.id,
              student_id: user.id,
              content: content.trim(),
              status: "SUBMITTED",
            })
            .select(
              "id, content, status, score, feedback, submitted_at, graded_at"
            )
            .single();

        if (error) {
          console.error(
            "Could not create submission:",
            error
          );
          setMessage(error.message);
          return;
        }

        setSubmission(
          newSubmission as ExistingSubmission
        );
        setMessage("Your assignment was submitted successfully.");
      }
    } catch (error) {
      console.error(
        "Submission error:",
        error
      );
      setMessage(
        "Something went wrong while submitting your assignment."
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
          <h1>Loading assignment...</h1>
        </section>
      </main>
    );
  }

  if (!assignment) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-content">
          <p className="dashboard-label">EDUQUEST</p>
          <h1>Assignment not found.</h1>

          <a
            href="/school-student/assignments"
            className="back-button"
          >
            <ArrowLeft size={17} />
            Back to Assignments
          </a>
        </section>
      </main>
    );
  }

  const isGraded =
    submission?.status === "GRADED";

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a
          href="/school-student/assignments"
          className="back-button"
        >
          <ArrowLeft size={17} />
          Back to Assignments
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
            ASSIGNMENT
          </p>

          <h1>
            {assignment.title}
          </h1>

          <p>
            Complete the task below and submit your work.
          </p>
        </div>

        <section className="assignment-detail-card">
          <div className="assignment-detail-header">
            <div className="student-assignment-icon">
              <GraduationCap size={24} />
            </div>

            <div>
              <p className="dashboard-label">
                YOUR ASSIGNMENT
              </p>

              <h2>{assignment.title}</h2>
            </div>
          </div>

          <div className="assignment-detail-meta">
            <div>
              <CalendarDays size={16} />

              <span>
                Due: {formatDueDate(assignment.due_date)}
              </span>
            </div>

            <div>
              <FileText size={16} />

              <span>
                Maximum points: {assignment.max_points}
              </span>
            </div>
          </div>

          <div className="assignment-description">
            <p className="dashboard-label">
              INSTRUCTIONS
            </p>

            <p>
              {assignment.description ||
                "No additional instructions were provided."}
            </p>
          </div>

          {isGraded && (
            <div className="graded-result">
              <CheckCircle2 size={21} />

              <div>
                <strong>
                  Assignment graded
                </strong>

                <p>
                  Score: {submission?.score ?? 0} /{" "}
                  {assignment.max_points}
                </p>

                {submission?.feedback && (
                  <span>
                    Feedback: {submission.feedback}
                  </span>
                )}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="submission-form"
          >
            <div className="assignment-field">
              <label htmlFor="content">
                Your answer
              </label>

              <textarea
                id="content"
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                placeholder="Write your answer here..."
                rows={12}
                disabled={isGraded || saving}
              />
            </div>

            {message && (
              <div className="assignment-message">
                {message}
              </div>
            )}

            {!isGraded && (
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    {submission
                      ? "Update Submission"
                      : "Submit Assignment"}
                  </>
                )}
              </button>
            )}

            {submission && !isGraded && (
              <p className="submission-status">
                Your current submission was saved. You can
                update it until your teacher grades it.
              </p>
            )}
          </form>
        </section>
      </section>
    </main>
  );
}