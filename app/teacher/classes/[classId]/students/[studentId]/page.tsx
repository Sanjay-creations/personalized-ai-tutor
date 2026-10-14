"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  GraduationCap,
  LogOut,
  Target,
  Trophy,
  Zap,
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

type GameResult = {
  game_name: string;
  subject: string;
  topic: string;
  score: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy: number;
  xp_earned: number;
  created_at: string;
};

export default function StudentPerformancePage() {
  const params = useParams<{
    classId: string;
    studentId: string;
  }>();

  const [teacherName, setTeacherName] = useState("Teacher");
  const [classDetails, setClassDetails] =
    useState<ClassDetails | null>(null);
  const [student, setStudent] =
    useState<StudentProfile | null>(null);
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudentPerformance() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const classId = Number(params.classId);
        const studentId = params.studentId;

        if (!Number.isInteger(classId) || !studentId) {
          window.location.href = "/teacher";
          return;
        }

        const { data: teacherProfile, error: teacherError } =
          await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("user_id", user.id)
            .single();

        if (teacherError || !teacherProfile) {
          console.error(
            "Could not load teacher profile:",
            teacherError
          );
          window.location.href = "/login";
          return;
        }

        if (
          teacherProfile.role !== "SCHOOL_TEACHER" &&
          teacherProfile.role !== "COLLEGE_TEACHER"
        ) {
          window.location.href = "/";
          return;
        }

        setTeacherName(
          teacherProfile.full_name || "Teacher"
        );

        // Verify that this class belongs to this teacher.
        const { data: classData, error: classError } =
          await supabase
            .from("classes")
            .select("id, name, subject, section")
            .eq("id", classId)
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

        setClassDetails(classData as ClassDetails);

        // Verify that the student belongs to this class.
        const {
          data: membership,
          error: membershipError,
        } = await supabase
          .from("class_members")
          .select("student_id")
          .eq("class_id", classId)
          .eq("student_id", studentId)
          .single();

        if (membershipError || !membership) {
          console.error(
            "Student is not a member of this class:",
            membershipError
          );
          window.location.href = `/teacher/classes/${classId}`;
          return;
        }

        // Load the student's profile.
        const {
          data: studentProfile,
          error: studentError,
        } = await supabase
          .from("profiles")
          .select("user_id, full_name, role")
          .eq("user_id", studentId)
          .eq("role", "SCHOOL_STUDENT")
          .single();

        if (studentError || !studentProfile) {
          console.error(
            "Could not load student profile:",
            studentError
          );
          window.location.href = `/teacher/classes/${classId}`;
          return;
        }

        setStudent(
          studentProfile as StudentProfile
        );

        // Load the student's real game results.
        const {
          data: gameResults,
          error: resultsError,
        } = await supabase
          .from("game_results")
          .select(
            "game_name, subject, topic, score, correct_answers, incorrect_answers, accuracy, xp_earned, created_at"
          )
          .eq("user_id", studentId)
          .order("created_at", {
            ascending: false,
          });

        if (resultsError) {
          console.error(
            "Could not load student results:",
            resultsError
          );
          setResults([]);
          return;
        }

        setResults(
          (gameResults as GameResult[]) || []
        );
      } catch (error) {
        console.error(
          "Student performance error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadStudentPerformance();
  }, [params.classId, params.studentId]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      return;
    }

    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="teacher-page">
        <section className="teacher-main">
          <p className="teacher-label">EDUQUEST</p>
          <h1>Loading student performance...</h1>
        </section>
      </main>
    );
  }

  if (!classDetails || !student) {
    return (
      <main className="teacher-page">
        <section className="teacher-main">
          <p className="teacher-label">EDUQUEST</p>
          <h1>Student not found.</h1>

          <a
            href={`/teacher/classes/${params.classId}`}
            className="teacher-view-button"
          >
            <ArrowLeft size={16} />
            Back to Class
          </a>
        </section>
      </main>
    );
  }

  const totalGames = results.length;

  const totalXp = results.reduce(
    (total, result) =>
      total + Number(result.xp_earned || 0),
    0
  );

  const totalCorrect = results.reduce(
    (total, result) =>
      total + Number(result.correct_answers || 0),
    0
  );

  const totalIncorrect = results.reduce(
    (total, result) =>
      total + Number(result.incorrect_answers || 0),
    0
  );

  const totalQuestions =
    totalCorrect + totalIncorrect;

  const overallAccuracy =
    totalQuestions > 0
      ? Math.round(
          (totalCorrect / totalQuestions) * 100
        )
      : 0;

  const subjectMap = new Map<
    string,
    {
      correct: number;
      incorrect: number;
    }
  >();

  results.forEach((result) => {
    const subject = result.subject || "General";

    const current = subjectMap.get(subject) || {
      correct: 0,
      incorrect: 0,
    };

    current.correct += Number(
      result.correct_answers || 0
    );

    current.incorrect += Number(
      result.incorrect_answers || 0
    );

    subjectMap.set(subject, current);
  });

  const subjectPerformance = Array.from(
    subjectMap.entries()
  )
    .map(([subject, data]) => {
      const questions =
        data.correct + data.incorrect;

      return {
        subject,
        accuracy:
          questions > 0
            ? Math.round(
                (data.correct / questions) * 100
              )
            : 0,
      };
    })
    .sort((a, b) => b.accuracy - a.accuracy);

  const strongestSubject =
    subjectPerformance.length > 0
      ? subjectPerformance[0]
      : null;

  const weakestSubject =
    subjectPerformance.length > 0
      ? subjectPerformance[
          subjectPerformance.length - 1
        ]
      : null;

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
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </header>

      <section className="teacher-main">
        <a
          href={`/teacher/classes/${classDetails.id}`}
          className="back-button"
        >
          <ArrowLeft size={17} />
          Back to Class
        </a>

        <div className="teacher-welcome">
          <div>
            <p className="teacher-label">
              STUDENT PERFORMANCE
            </p>

            <h1>
              {student.full_name}
              <span>
                {" "}
                · {classDetails.name}
              </span>
            </h1>

            <p>
              {classDetails.subject} · Section{" "}
              {classDetails.section}
            </p>
          </div>
        </div>

        <section className="teacher-overview">
          <div>
            <span>GAMES PLAYED</span>
            <strong>{totalGames}</strong>
          </div>

          <div>
            <span>TOTAL XP</span>
            <strong>{totalXp}</strong>
          </div>

          <div>
            <span>ACCURACY</span>
            <strong>{overallAccuracy}%</strong>
          </div>

          <div>
            <span>QUESTIONS ANSWERED</span>
            <strong>{totalQuestions}</strong>
          </div>
        </section>

        <section className="teacher-section">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                PERFORMANCE
              </p>

              <h2>Learning overview</h2>
            </div>

            <BarChart3 size={21} />
          </div>

          <div className="teacher-insights">
            <div className="teacher-insight-card">
              <div className="teacher-insight-icon">
                <Trophy size={20} />
              </div>

              <div>
                <strong>Strongest subject</strong>

                <p>
                  {strongestSubject
                    ? `${strongestSubject.subject} · ${strongestSubject.accuracy}% accuracy`
                    : "No subject data yet."}
                </p>
              </div>
            </div>

            <div className="teacher-insight-card">
              <div className="teacher-insight-icon">
                <Target size={20} />
              </div>

              <div>
                <strong>
                  Area requiring more practice
                </strong>

                <p>
                  {weakestSubject
                    ? `${weakestSubject.subject} · ${weakestSubject.accuracy}% accuracy`
                    : "No subject data yet."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="teacher-section">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                SUBJECTS
              </p>

              <h2>Subject performance</h2>
            </div>

            <BookOpen size={21} />
          </div>

          {subjectPerformance.length === 0 ? (
            <div className="teacher-material-panel">
              <div>
                <strong>
                  No learning results yet
                </strong>

                <p>
                  This student has not completed any
                  tracked learning games yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="teacher-insights">
              {subjectPerformance.map((item) => (
                <div
                  className="teacher-insight-card"
                  key={item.subject}
                >
                  <div className="teacher-insight-icon">
                    <BookOpen size={20} />
                  </div>

                  <div>
                    <strong>{item.subject}</strong>

                    <p>
                      {item.accuracy}% accuracy
                    </p>

                    <div className="teacher-performance-bar">
                      <div
                        style={{
                          width: `${item.accuracy}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="teacher-section">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                RECENT ACTIVITY
              </p>

              <h2>Recent learning games</h2>
            </div>

            <Zap size={21} />
          </div>

          {results.length === 0 ? (
            <div className="teacher-material-panel">
              <div>
                <strong>
                  No game activity yet
                </strong>

                <p>
                  Recent game attempts will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="teacher-class-grid">
              {results.slice(0, 10).map((result, index) => (
                <div
                  className="teacher-class-card"
                  key={`${result.created_at}-${index}`}
                >
                  <div className="teacher-class-top">
                    <div className="teacher-class-icon">
                      <Zap size={22} />
                    </div>

                    <span>{result.subject}</span>
                  </div>

                  <h3>{result.game_name}</h3>

                  <div className="teacher-class-stats">
                    <div>
                      <span>Score</span>
                      <strong>{result.score}</strong>
                    </div>

                    <div>
                      <span>Accuracy</span>
                      <strong>{result.accuracy}%</strong>
                    </div>

                    <div>
                      <span>XP</span>
                      <strong>
                        +{result.xp_earned}
                      </strong>
                    </div>
                  </div>

                  <p className="teacher-activity-date">
                    {new Date(
                      result.created_at
                    ).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}