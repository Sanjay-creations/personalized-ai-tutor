"use client";

import { use, useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  LogOut,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ClassDetails = {
  id: number;
  name: string;
  subject: string;
  section: string;
};

type StudentProfile = {
  user_id: string;
  full_name: string;
  role: string;
};

type ClassAssignment = {
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
  assignment_id: string;
  student_id: string;
  status: string;
};

type GameResult = {
  user_id: string;
  correct_answers: number;
  incorrect_answers: number;
  xp_earned: number;
};

type StudentPerformance = {
  gamesPlayed: number;
  accuracy: number;
  xp: number;
};

export default function ClassDetailsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);

  const [teacherName, setTeacherName] = useState("Teacher");

  const [classDetails, setClassDetails] =
    useState<ClassDetails | null>(null);

  const [students, setStudents] =
    useState<StudentProfile[]>([]);

  const [assignments, setAssignments] =
    useState<ClassAssignment[]>([]);

  const [submissionCounts, setSubmissionCounts] =
    useState<Record<string, number>>({});

  const [pendingCounts, setPendingCounts] =
    useState<Record<string, number>>({});

  const [gradedCounts, setGradedCounts] =
    useState<Record<string, number>>({});

  const [studentPerformance, setStudentPerformance] =
    useState<Record<string, StudentPerformance>>({});

  const [loading, setLoading] = useState(true);

  const [loadingAssignments, setLoadingAssignments] =
    useState(true);

  const [loadingPerformance, setLoadingPerformance] =
    useState(true);

  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadClass() {
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

        setTeacherName(
          profile.full_name || "Teacher"
        );

        const numericClassId = Number(classId);

        if (!Number.isInteger(numericClassId)) {
          window.location.href = "/teacher";
          return;
        }

        // ----------------------------------------
        // LOAD CLASS
        // ----------------------------------------

        const {
          data: classData,
          error: classError,
        } = await supabase
          .from("classes")
          .select(
            "id, name, subject, section"
          )
          .eq("id", numericClassId)
          .eq("teacher_id", user.id)
          .single();

        if (classError || !classData) {
          console.error(
            "Could not load class:",
            classError
          );

          window.location.href = "/teacher";
          return;
        }

        setClassDetails(
          classData as ClassDetails
        );

        // ----------------------------------------
        // LOAD STUDENTS
        // ----------------------------------------

        const {
          data: memberships,
          error: membershipsError,
        } = await supabase
          .from("class_members")
          .select("student_id")
          .eq("class_id", numericClassId);

        if (membershipsError) {
          console.error(
            "Could not load class members:",
            membershipsError
          );

          setStudents([]);
        } else {
          const studentIds =
            (memberships || []).map(
              (member) => member.student_id
            );

          if (studentIds.length === 0) {
            setStudents([]);
          } else {
            const {
              data: studentProfiles,
              error: studentProfilesError,
            } = await supabase
              .from("profiles")
              .select(
                "user_id, full_name, role"
              )
              .in("user_id", studentIds)
              .eq("role", "SCHOOL_STUDENT");

            if (studentProfilesError) {
              console.error(
                "Could not load student profiles:",
                studentProfilesError
              );

              setStudents([]);
            } else {
              const loadedStudents =
                (studentProfiles as StudentProfile[]) ||
                [];

              setStudents(loadedStudents);

              // ----------------------------------------
              // LOAD STUDENT GAME PERFORMANCE
              // ----------------------------------------

              if (studentIds.length === 0) {
                setStudentPerformance({});
              } else {
                const {
                  data: gameResults,
                  error: gameResultsError,
                } = await supabase
                  .from("game_results")
                  .select(
                    "user_id, correct_answers, incorrect_answers, xp_earned"
                  )
                  .in("user_id", studentIds);

                if (gameResultsError) {
                  console.error(
                    "Could not load student game results:",
                    gameResultsError
                  );

                  setStudentPerformance({});
                } else {
                  const performanceMap: Record<
                    string,
                    StudentPerformance
                  > = {};

                  for (const studentId of studentIds) {
                    performanceMap[studentId] = {
                      gamesPlayed: 0,
                      accuracy: 0,
                      xp: 0,
                    };
                  }

                  const results =
                    (gameResults as GameResult[]) || [];

                  for (const result of results) {
                    const existing =
                      performanceMap[result.user_id] || {
                        gamesPlayed: 0,
                        accuracy: 0,
                        xp: 0,
                      };

                    existing.gamesPlayed += 1;

                    existing.xp += Number(
                      result.xp_earned || 0
                    );

                    const correct =
                      Number(
                        result.correct_answers || 0
                      );

                    const incorrect =
                      Number(
                        result.incorrect_answers || 0
                      );

                    const totalQuestions =
                      correct + incorrect;

                    // Store accuracy temporarily as total
                    // correct count percentage across games.
                    const previousCorrect =
                      Math.round(
                        (existing.accuracy / 100) *
                          (existing as StudentPerformance & {
                            _questions?: number;
                          })._questions! || 0
                      );

                    existing.accuracy =
                      totalQuestions > 0
                        ? Math.round(
                            (correct /
                              totalQuestions) *
                              100
                          )
                        : existing.accuracy;

                    performanceMap[result.user_id] =
                      existing;
                  }

                  // Recalculate accuracy cleanly.
                  const correctTotals: Record<
                    string,
                    number
                  > = {};

                  const questionTotals: Record<
                    string,
                    number
                  > = {};

                  for (const studentId of studentIds) {
                    correctTotals[studentId] = 0;
                    questionTotals[studentId] = 0;
                  }

                  for (const result of results) {
                    correctTotals[result.user_id] =
                      (correctTotals[result.user_id] || 0) +
                      Number(
                        result.correct_answers || 0
                      );

                    questionTotals[result.user_id] =
                      (questionTotals[result.user_id] || 0) +
                      Number(
                        result.correct_answers || 0
                      ) +
                      Number(
                        result.incorrect_answers || 0
                      );
                  }

                  for (const studentId of studentIds) {
                    const total =
                      questionTotals[studentId] || 0;

                    performanceMap[studentId].accuracy =
                      total > 0
                        ? Math.round(
                            ((correctTotals[studentId] || 0) /
                              total) *
                              100
                          )
                        : 0;
                  }

                  setStudentPerformance(
                    performanceMap
                  );
                }
              }
            }
          }
        }

        setLoadingPerformance(false);

        // ----------------------------------------
        // LOAD ASSIGNMENTS FOR THIS CLASS
        // ----------------------------------------

        const {
          data: classAssignments,
          error: assignmentsError,
        } = await supabase
          .from("assignments")
          .select(
            "id, class_id, title, description, due_date, max_points, created_at"
          )
          .eq("class_id", numericClassId)
          .eq("teacher_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (assignmentsError) {
          console.error(
            "Could not load class assignments:",
            assignmentsError
          );

          setAssignments([]);
          return;
        }

        const loadedAssignments =
          (classAssignments as ClassAssignment[]) ||
          [];

        setAssignments(loadedAssignments);

        // ----------------------------------------
        // LOAD SUBMISSION COUNTS
        // ----------------------------------------

        if (loadedAssignments.length === 0) {
          setSubmissionCounts({});
          setPendingCounts({});
          setGradedCounts({});
          return;
        }

        const assignmentIds =
          loadedAssignments.map(
            (assignment) => assignment.id
          );

        const {
          data: submissions,
          error: submissionsError,
        } = await supabase
          .from("submissions")
          .select(
            "id, assignment_id, student_id, status"
          )
          .in("assignment_id", assignmentIds);

        if (submissionsError) {
          console.error(
            "Could not load assignment submissions:",
            submissionsError
          );

          setSubmissionCounts({});
          setPendingCounts({});
          setGradedCounts({});
          return;
        }

        const allSubmissions =
          (submissions as Submission[]) || [];

        const totalCounts: Record<string, number> = {};
        const pending: Record<string, number> = {};
        const graded: Record<string, number> = {};

        for (const assignment of loadedAssignments) {
          totalCounts[assignment.id] = 0;
          pending[assignment.id] = 0;
          graded[assignment.id] = 0;
        }

        for (const submission of allSubmissions) {
          totalCounts[submission.assignment_id] =
            (totalCounts[
              submission.assignment_id
            ] || 0) + 1;

          if (
            submission.status ===
            "SUBMITTED"
          ) {
            pending[submission.assignment_id] =
              (pending[
                submission.assignment_id
              ] || 0) + 1;
          }

          if (
            submission.status ===
            "GRADED"
          ) {
            graded[submission.assignment_id] =
              (graded[
                submission.assignment_id
              ] || 0) + 1;
          }
        }

        setSubmissionCounts(totalCounts);
        setPendingCounts(pending);
        setGradedCounts(graded);
      } catch (error) {
        console.error(
          "Class details error:",
          error
        );
      } finally {
        setLoading(false);
        setLoadingAssignments(false);
        setLoadingPerformance(false);
      }
    }

    loadClass();
  }, [classId]);

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

  function formatDueDate(
    dueDate: string | null
  ) {
    if (!dueDate) {
      return "No due date";
    }

    return new Date(
      dueDate
    ).toLocaleDateString();
  }

  if (loading) {
    return (
      <main className="teacher-page">
        <section className="teacher-main">
          <p className="teacher-label">
            EDUQUEST
          </p>

          <h1>
            Loading class...
          </h1>
        </section>
      </main>
    );
  }

  if (!classDetails) {
    return (
      <main className="teacher-page">
        <section className="teacher-main">
          <p className="teacher-label">
            EDUQUEST
          </p>

          <h1>
            Class not found.
          </h1>

          <a
            href="/teacher"
            className="teacher-view-button"
          >
            <ArrowLeft size={16} />
            Back to Teacher Dashboard
          </a>
        </section>
      </main>
    );
  }

  const totalPendingTasks =
    Object.values(
      pendingCounts
    ).reduce(
      (total, count) =>
        total + count,
      0
    );

  const totalSubmissions =
    Object.values(
      submissionCounts
    ).reduce(
      (total, count) =>
        total + count,
      0
    );

  return (
    <main className="teacher-page">
      <header className="teacher-header">
        <a
          href="/"
          className="teacher-brand"
        >
          <div className="teacher-logo">
            <GraduationCap size={20} />
          </div>

          <span>EDUQUEST</span>
        </a>

        <div className="teacher-user">
          <div className="teacher-avatar">
            {teacherName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {teacherName}
            </strong>

            <span>
              Teacher
            </span>
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
              MY CLASS
            </p>

            <h1>
              {classDetails.name}
              <span>
                {" "}
                - Section{" "}
                {classDetails.section}
              </span>
            </h1>

            <p>
              {classDetails.subject} ·{" "}
              {students.length}{" "}
              {students.length === 1
                ? "student"
                : "students"}
            </p>
          </div>
        </div>

        <section className="teacher-overview">
          <div>
            <span>STUDENTS</span>

            <strong>
              {students.length}
            </strong>
          </div>

          <div>
            <span>ASSIGNMENTS</span>

            <strong>
              {assignments.length}
            </strong>
          </div>

          <div>
            <span>SUBMISSIONS</span>

            <strong>
              {totalSubmissions}
            </strong>
          </div>

          <div>
            <span>PENDING</span>

            <strong>
              {totalPendingTasks}
            </strong>
          </div>
        </section>

        {/* STUDENTS */}
        <section className="teacher-section">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                STUDENTS
              </p>

              <h2>
                Students in this class
              </h2>
            </div>

            <Users size={21} />
          </div>

          {students.length === 0 ? (
            <div className="teacher-material-panel">
              <div>
                <strong>
                  No students enrolled yet
                </strong>

                <p>
                  Students assigned to this class
                  will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="teacher-class-grid">
              {students.map(
                (student) => {
                  const performance =
                    studentPerformance[
                      student.user_id
                    ];

                  return (
                    <div
                      className="teacher-class-card"
                      key={
                        student.user_id
                      }
                    >
                      <div className="teacher-class-top">
                        <div className="teacher-class-icon">
                          <GraduationCap
                            size={22}
                          />
                        </div>

                        <span>
                          SCHOOL STUDENT
                        </span>
                      </div>

                      <h3>
                        {student.full_name}
                      </h3>

                      <div className="teacher-class-stats">
                        <div>
                          <span>
                            Games
                          </span>

                          <strong>
                            {loadingPerformance
                              ? "..."
                              : performance?.gamesPlayed ??
                                0}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Accuracy
                          </span>

                          <strong>
                            {loadingPerformance
                              ? "..."
                              : `${performance?.accuracy ?? 0}%`}
                          </strong>
                        </div>

                        <div>
                          <span>
                            XP
                          </span>

                          <strong>
                            {loadingPerformance
                              ? "..."
                              : performance?.xp ??
                                0}
                          </strong>
                        </div>
                      </div>

                      <div className="teacher-performance-bar">
                        <div
                          style={{
                            width: `${
                              performance?.accuracy ??
                              0
                            }%`,
                          }}
                        />
                      </div>

                      <a
                        href={`/teacher/classes/${classDetails.id}/students/${student.user_id}`}
                        className="teacher-view-button"
                      >
                        View Student
                        <BookOpen
                          size={16}
                        />
                      </a>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* ASSIGNMENTS */}
        <section className="teacher-section">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                ASSIGNMENTS
              </p>

              <h2>
                Class assignments
              </h2>
            </div>

            <FileText size={21} />
          </div>

          {loadingAssignments ? (
            <div className="teacher-material-panel">
              <div>
                <strong>
                  Loading assignments...
                </strong>

                <p>
                  EDUQUEST is loading assignments
                  for this class.
                </p>
              </div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="teacher-material-panel">
              <div>
                <strong>
                  No assignments yet
                </strong>

                <p>
                  Create an assignment for this
                  class to give students work.
                </p>
              </div>

              <a
                href="/teacher/assignments/new"
                className="teacher-action-button"
              >
                Create Assignment
                <ArrowRightIcon />
              </a>
            </div>
          ) : (
            <div className="teacher-assignment-grid">
              {assignments.map(
                (assignment) => {
                  const submissionCount =
                    submissionCounts[
                      assignment.id
                    ] || 0;

                  const pendingCount =
                    pendingCounts[
                      assignment.id
                    ] || 0;

                  const gradedCount =
                    gradedCounts[
                      assignment.id
                    ] || 0;

                  return (
                    <article
                      className="teacher-assignment-card"
                      key={
                        assignment.id
                      }
                    >
                      <div className="teacher-assignment-top">
                        <div className="teacher-class-icon">
                          <FileText
                            size={22}
                          />
                        </div>

                        <span>
                          {
                            assignment.max_points
                          }{" "}
                          points
                        </span>
                      </div>

                      <h3>
                        {assignment.title}
                      </h3>

                      <p className="teacher-assignment-description">
                        {assignment.description ||
                          "No description provided."}
                      </p>

                      <div className="teacher-assignment-meta">
                        <div>
                          <CalendarDays
                            size={15}
                          />

                          <span>
                            Due:{" "}
                            {formatDueDate(
                              assignment.due_date
                            )}
                          </span>
                        </div>

                        <div>
                          <Users
                            size={15}
                          />

                          <span>
                            {submissionCount}{" "}
                            {submissionCount ===
                            1
                              ? "submission"
                              : "submissions"}
                          </span>
                        </div>
                      </div>

                      <div className="teacher-assignment-status">
                        <span>
                          Pending:{" "}
                          {pendingCount}
                        </span>

                        <span>
                          Graded:{" "}
                          {gradedCount}
                        </span>
                      </div>

                      <a
                        href={`/teacher/assignments/${assignment.id}`}
                        className="teacher-view-button"
                      >
                        View Assignment
                        <ArrowRightIcon />
                      </a>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* CLASS WORKSPACE */}
        <section className="teacher-section">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                CLASS WORKSPACE
              </p>

              <h2>
                Teaching tools
              </h2>
            </div>

            <BookOpen size={21} />
          </div>

          <div className="teacher-insights">
            <div className="teacher-insight-card">
              <div className="teacher-insight-icon">
                <BookOpen size={20} />
              </div>

              <div>
                <strong>
                  Learning materials
                </strong>

                <p>
                  Upload and organize
                  resources for this class.
                </p>
              </div>

              <button>
                Coming Soon
              </button>
            </div>

            <div className="teacher-insight-card">
              <div className="teacher-insight-icon">
                <Users size={20} />
              </div>

              <div>
                <strong>
                  Student analytics
                </strong>

                <p>
                  View detailed performance
                  from the student profiles.
                </p>
              </div>

              <button>
                Open Students →
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
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
      <line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
      />

      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}