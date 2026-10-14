"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  GraduationCap,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Course = {
  id: number;
  title: string;
  code: string;
  description: string | null;
};

type CourseMembership = {
  course_id: number;
};

export default function CollegeCoursesPage() {
  const [studentName, setStudentName] =
    useState("College Student");

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  useEffect(() => {
    async function loadCourses() {
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
            "Could not load college student profile:",
            profileError
          );

          window.location.href = "/login";
          return;
        }

        if (profile.role !== "COLLEGE_STUDENT") {
          window.location.href = "/";
          return;
        }

        setStudentName(
          profile.full_name || "College Student"
        );

        // ----------------------------------------
        // LOAD COURSE MEMBERSHIPS
        // ----------------------------------------

        const {
          data: memberships,
          error: membershipsError,
        } = await supabase
          .from("course_members")
          .select("course_id")
          .eq("student_id", user.id);

        if (membershipsError) {
          console.error(
            "Could not load course memberships:",
            membershipsError
          );

          setCourses([]);
          return;
        }

        const courseIds = (
          (memberships as CourseMembership[]) || []
        ).map(
          (membership) => membership.course_id
        );

        if (courseIds.length === 0) {
          setCourses([]);
          return;
        }

        // ----------------------------------------
        // LOAD COURSES
        // ----------------------------------------

        const {
          data: courseData,
          error: coursesError,
        } = await supabase
          .from("courses")
          .select(
            "id, title, code, description"
          )
          .in("id", courseIds)
          .order("title", {
            ascending: true,
          });

        if (coursesError) {
          console.error(
            "Could not load courses:",
            coursesError
          );

          setCourses([]);
          return;
        }

        setCourses(
          (courseData as Course[]) || []
        );
      } catch (error) {
        console.error(
          "College courses error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

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

  if (loading) {
    return (
      <main className="college-page">
        <section className="college-main">
          <p className="college-label">
            EDUQUEST
          </p>

          <h1>
            Loading your courses...
          </h1>
        </section>
      </main>
    );
  }

  return (
    <main className="college-page">
      <header className="college-header">
        <a
          href="/college-student"
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
          href="/college-student"
          className="college-back-button"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </a>

        <div className="college-welcome">
          <div>
            <p className="college-label">
              MY COURSES
            </p>

            <h1>
              Your learning
              <span>
                {" "}
                workspace.
              </span>
            </h1>

            <p>
              Access the courses you are currently
              enrolled in and continue building your skills.
            </p>
          </div>

          <div className="college-course-count">
            <span>
              ACTIVE COURSES
            </span>

            <strong>
              {courses.length}
            </strong>
          </div>
        </div>

        {courses.length === 0 ? (
          <section className="college-panel college-empty-courses">
            <div className="college-panel-heading">
              <div>
                <p className="college-label">
                  COURSES
                </p>

                <h2>
                  No courses yet
                </h2>
              </div>

              <BookOpen size={21} />
            </div>

            <p>
              You are not enrolled in any college
              courses yet. Once a course is assigned to
              your account, it will appear here.
            </p>
          </section>
        ) : (
          <section className="college-course-section">
            <div className="college-section-heading">
              <div>
                <p className="college-label">
                  ENROLLED COURSES
                </p>

                <h2>
                  Continue your coursework.
                </h2>
              </div>

              <BookOpen size={21} />
            </div>

            <div className="college-course-grid">
              {courses.map((course) => (
                <article
                  className="college-course-card"
                  key={course.id}
                >
                  <div className="college-course-top">
                    <div className="college-course-icon">
                      <BookOpen size={23} />
                    </div>

                    <span>
                      {course.code}
                    </span>
                  </div>

                  <h2>
                    {course.title}
                  </h2>

                  <p>
                    {course.description ||
                      "No course description has been added yet."}
                  </p>

                  <div className="college-course-divider" />

                  <div className="college-course-info">
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
                  </div>

                  <a
                    href={`/college-student/courses/${course.id}`}
                    className="college-course-button"
                  >
                    Open Course
                    <ArrowRight size={16} />
                  </a>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}