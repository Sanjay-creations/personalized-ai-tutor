"use client";

import { use, useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  Code2,
  FileText,
  GraduationCap,
  LogOut,
  Target,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Course = {
  id: number;
  title: string;
  code: string;
  description: string | null;
  teacher_id: string | null;
};

type TeacherProfile = {
  user_id: string;
  full_name: string;
};

export default function CollegeCourseDetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);

  const [studentName, setStudentName] =
    useState("College Student");

  const [course, setCourse] =
    useState<Course | null>(null);

  const [teacher, setTeacher] =
    useState<TeacherProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  useEffect(() => {
    async function loadCourse() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        // ----------------------------------------
        // VERIFY COLLEGE STUDENT
        // ----------------------------------------

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
            "Could not load student profile:",
            profileError
          );

          window.location.href = "/login";
          return;
        }

        if (
          profile.role !== "COLLEGE_STUDENT"
        ) {
          window.location.href = "/";
          return;
        }

        setStudentName(
          profile.full_name ||
            "College Student"
        );

        // ----------------------------------------
        // VALIDATE COURSE ID
        // ----------------------------------------

        const numericCourseId =
          Number(courseId);

        if (
          !Number.isInteger(
            numericCourseId
          )
        ) {
          window.location.href =
            "/college-student/courses";
          return;
        }

        // ----------------------------------------
        // VERIFY ENROLLMENT
        // ----------------------------------------

        const {
          data: membership,
          error: membershipError,
        } = await supabase
          .from("course_members")
          .select("course_id")
          .eq(
            "course_id",
            numericCourseId
          )
          .eq("student_id", user.id)
          .single();

        if (
          membershipError ||
          !membership
        ) {
          console.error(
            "Student is not enrolled in this course:",
            membershipError
          );

          window.location.href =
            "/college-student/courses";

          return;
        }

        // ----------------------------------------
        // LOAD COURSE
        // ----------------------------------------

        const {
          data: courseData,
          error: courseError,
        } = await supabase
          .from("courses")
          .select(
            "id, title, code, description, teacher_id"
          )
          .eq(
            "id",
            numericCourseId
          )
          .single();

        if (
          courseError ||
          !courseData
        ) {
          console.error(
            "Could not load course:",
            courseError
          );

          window.location.href =
            "/college-student/courses";

          return;
        }

        const loadedCourse =
          courseData as Course;

        setCourse(loadedCourse);

        // ----------------------------------------
        // LOAD TEACHER PROFILE
        // ----------------------------------------

        if (loadedCourse.teacher_id) {
  const {
    data: teacherData,
    error: teacherError,
  } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .eq(
      "user_id",
      loadedCourse.teacher_id
    )
    .maybeSingle();

  if (teacherError) {
    console.error(
      "Could not load course teacher:",
      teacherError
    );
  } else if (teacherData) {
    setTeacher(
      teacherData as TeacherProfile
    );
  }
}
      } catch (error) {
        console.error(
          "College course details error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [courseId]);

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

    window.location.href =
      "/login";
  }

  if (loading) {
    return (
      <main className="college-page">
        <section className="college-main">
          <p className="college-label">
            EDUQUEST
          </p>

          <h1>
            Loading course...
          </h1>
        </section>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="college-page">
        <section className="college-main">
          <p className="college-label">
            EDUQUEST
          </p>

          <h1>
            Course not found.
          </h1>

          <a
            href="/college-student/courses"
            className="college-back-button"
          >
            <ArrowLeft size={17} />
            Back to My Courses
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="college-page">
      <header className="college-header">
        <a
          href="/"
          className="college-brand"
        >
          <div className="college-logo">
            <GraduationCap size={20} />
          </div>

          <span>
            EDUQUEST
          </span>
        </a>

        <nav className="college-nav">
          <a href="/college-student">
            Dashboard
          </a>

          <a href="/college-student/courses">
            My Courses
          </a>

          <a href="/college-student/analytics">
            Analytics
          </a>
        </nav>

        <div className="college-actions">
          <div className="college-user">
            <div className="college-avatar">
              {studentName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {studentName}
              </strong>

              <span>
                College Student
              </span>
            </div>

            <button
              className="college-logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut size={16} />

              {loggingOut
                ? "Signing out..."
                : "Sign out"}
            </button>
          </div>
        </div>
      </header>

      <section className="college-main">
        <a
          href="/college-student/courses"
          className="college-back-button"
        >
          <ArrowLeft size={17} />
          Back to My Courses
        </a>

        {/* Course Header */}
        <section className="college-course-hero">
          <div>
            <p className="college-label">
              COURSE WORKSPACE
            </p>

            <div className="college-course-code">
              {course.code}
            </div>

            <h1>
              {course.title}
            </h1>

            <p>
              {course.description ||
                "No course description has been added yet."}
            </p>

            {teacher && (
              <div className="college-course-teacher">
                <GraduationCap size={16} />

                <span>
                  Instructor:{" "}
                  <strong>
                    {teacher.full_name}
                  </strong>
                </span>
              </div>
            )}
          </div>

          <div className="college-course-hero-icon">
            <BookOpen size={42} />
          </div>
        </section>

        {/* Course Stats */}
        <section className="college-quick-stats">
          <div>
            <span>
              COURSE CODE
            </span>

            <strong>
              {course.code}
            </strong>
          </div>

          <div>
            <span>
              STATUS
            </span>

            <strong>
              Enrolled
            </strong>
          </div>

          <div>
            <span>
              PROGRESS
            </span>

            <strong>
              —
            </strong>
          </div>

          <div>
            <span>
              SCORE
            </span>

            <strong>
              —
            </strong>
          </div>
        </section>

        {/* Course Tools */}
        <section className="college-course-section">
          <div className="college-section-heading">
            <div>
              <p className="college-label">
                COURSE TOOLS
              </p>

              <h2>
                Continue learning.
              </h2>
            </div>

            <Target size={21} />
          </div>

          <div className="college-course-tools-grid">
            <a
              href="/college-student/ai-research"
              className="college-course-tool"
            >
              <div className="college-course-tool-icon">
                <Brain size={22} />
              </div>

              <h3>
                AI Research Assistant
              </h3>

              <p>
                Explore this subject with AI
                explanations and guided research.
              </p>

              <span>
                Open Assistant →
              </span>
            </a>

            <a
              href="/college-student/mock-tests"
              className="college-course-tool"
            >
              <div className="college-course-tool-icon">
                <FileText size={22} />
              </div>

              <h3>
                Mock Tests
              </h3>

              <p>
                Practice exam-style questions and
                check your understanding.
              </p>

              <span>
                Take a Test →
              </span>
            </a>

            <a
              href="/college-student/programming"
              className="college-course-tool"
            >
              <div className="college-course-tool-icon">
                <Code2 size={22} />
              </div>

              <h3>
                Programming Practice
              </h3>

              <p>
                Strengthen problem-solving and
                programming skills.
              </p>

              <span>
                Practice →
              </span>
            </a>

            <a
              href="/college-student/study-planner"
              className="college-course-tool"
            >
              <div className="college-course-tool-icon">
                <CalendarDays size={22} />
              </div>

              <h3>
                Study Planner
              </h3>

              <p>
                Organize your study sessions and
                upcoming coursework.
              </p>

              <span>
                Open Planner →
              </span>
            </a>
          </div>
        </section>

        {/* Course Workspace */}
        <section className="college-bottom-grid">
          <div className="college-panel">
            <div className="college-panel-heading">
              <div>
                <p className="college-label">
                  COURSE MATERIAL
                </p>

                <h2>
                  Learning resources
                </h2>
              </div>

              <BookOpen size={21} />
            </div>

            <div className="college-coming-soon">
              <FileText size={22} />

              <div>
                <strong>
                  Course materials
                </strong>

                <p>
                  Course-specific notes, documents
                  and resources will appear here as
                  the college materials system is
                  connected.
                </p>
              </div>
            </div>
          </div>

          <div className="college-panel">
            <div className="college-panel-heading">
              <div>
                <p className="college-label">
                  PERFORMANCE
                </p>

                <h2>
                  Your course progress
                </h2>
              </div>

              <BarChart3 size={21} />
            </div>

            <div className="college-coming-soon">
              <BarChart3 size={22} />

              <div>
                <strong>
                  Analytics coming next
                </strong>

                <p>
                  Course-specific accuracy,
                  completed topics and progress
                  will appear here once the
                  analytics layer is connected.
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}