"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  FileText,
  GraduationCap,
  LogOut,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type TeacherClass = {
  id: number;
  name: string;
  subject: string;
  section: string;
  created_at: string;
};

type ClassMember = {
  class_id: number;
  student_id: string;
};

type TeacherAssignment = {
  id: string;
  class_id: number;
};

type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  status: string;
};

export default function TeacherPage() {
  const [teacherName, setTeacherName] = useState("Teacher");
  const [teacherRole, setTeacherRole] = useState("");
  const [classes, setClasses] = useState<TeacherClass[]>([]);

  const [studentCounts, setStudentCounts] = useState<
    Record<number, number>
  >({});

  const [pendingCounts, setPendingCounts] = useState<
    Record<number, number>
  >({});

  const [totalPendingTasks, setTotalPendingTasks] = useState(0);
  const [totalAssignments, setTotalAssignments] = useState(0);

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAssignments, setLoadingAssignments] =
    useState(true);

  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadTeacherData() {
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

        const allowedTeacherRoles = [
          "SCHOOL_TEACHER",
          "COLLEGE_TEACHER",
        ];

        if (!allowedTeacherRoles.includes(profile.role)) {
          window.location.href = "/";
          return;
        }

        setTeacherName(profile.full_name || "Teacher");
        setTeacherRole(profile.role);
        setCheckingAccess(false);

        // ----------------------------------------
        // LOAD TEACHER CLASSES
        // ----------------------------------------

        const {
          data: teacherClasses,
          error: classesError,
        } = await supabase
          .from("classes")
          .select(
            "id, name, subject, section, created_at"
          )
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
          return;
        }

        const loadedClasses =
          (teacherClasses as TeacherClass[]) || [];

        setClasses(loadedClasses);

        // ----------------------------------------
        // LOAD STUDENT COUNTS
        // ----------------------------------------

        if (loadedClasses.length === 0) {
          setStudentCounts({});
        } else {
          const classIds = loadedClasses.map(
            (teacherClass) => teacherClass.id
          );

          const {
            data: memberships,
            error: membershipsError,
          } = await supabase
            .from("class_members")
            .select("class_id, student_id")
            .in("class_id", classIds);

          if (membershipsError) {
            console.error(
              "Could not load class members:",
              membershipsError
            );

            setStudentCounts({});
          } else {
            const counts: Record<number, number> = {};

            for (const classId of classIds) {
              counts[classId] = 0;
            }

            const members =
              (memberships as ClassMember[]) || [];

            for (const member of members) {
              counts[member.class_id] =
                (counts[member.class_id] || 0) + 1;
            }

            setStudentCounts(counts);
          }
        }

        // ----------------------------------------
        // LOAD ASSIGNMENTS
        // ----------------------------------------

        const {
          data: teacherAssignments,
          error: assignmentsError,
        } = await supabase
          .from("assignments")
          .select("id, class_id")
          .eq("teacher_id", user.id);

        if (assignmentsError) {
          console.error(
            "Could not load teacher assignments:",
            assignmentsError
          );

          setTotalAssignments(0);
          setTotalPendingTasks(0);
          setPendingCounts({});
          return;
        }

        const assignments =
          (teacherAssignments as TeacherAssignment[]) || [];

        setTotalAssignments(assignments.length);

        // No assignments = no pending work.
        if (assignments.length === 0) {
          setTotalPendingTasks(0);
          setPendingCounts({});
          return;
        }

        const assignmentIds = assignments.map(
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
            "Could not load submissions:",
            submissionsError
          );

          setTotalPendingTasks(0);
          setPendingCounts({});
          return;
        }

        const allSubmissions =
          (submissions as Submission[]) || [];

        // Only SUBMITTED submissions need teacher attention.
        const pendingSubmissions =
          allSubmissions.filter(
            (submission) =>
              submission.status === "SUBMITTED"
          );

        setTotalPendingTasks(
          pendingSubmissions.length
        );

        // Count pending submissions by class.
        const classAssignmentMap: Record<
          string,
          number
        > = {};

        for (const assignment of assignments) {
          classAssignmentMap[assignment.id] =
            assignment.class_id;
        }

        const classPendingCounts: Record<
          number,
          number
        > = {};

        for (const teacherClass of loadedClasses) {
          classPendingCounts[teacherClass.id] = 0;
        }

        for (const submission of pendingSubmissions) {
          const classId =
            classAssignmentMap[
              submission.assignment_id
            ];

          if (classId !== undefined) {
            classPendingCounts[classId] =
              (classPendingCounts[classId] || 0) + 1;
          }
        }

        setPendingCounts(classPendingCounts);
      } catch (error) {
        console.error(
          "Teacher dashboard error:",
          error
        );
      } finally {
        setLoadingClasses(false);
        setLoadingAssignments(false);
      }
    }

    loadTeacherData();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
      return;
    }

    window.location.href = "/login";
  }

  if (checkingAccess) {
    return (
      <main className="teacher-page">
        <section className="teacher-main">
          <p className="teacher-label">
            EDUQUEST
          </p>

          <h1>
            Loading your teacher workspace...
          </h1>
        </section>
      </main>
    );
  }

  const teacherType =
    teacherRole === "COLLEGE_TEACHER"
      ? "College Teacher"
      : "School Teacher";

  const totalClasses = classes.length;

  const totalStudents = classes.reduce(
    (total, teacherClass) =>
      total +
      (studentCounts[teacherClass.id] || 0),
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

        <nav className="teacher-nav">
          <a href="#classes">
            My Classes
          </a>

          <a href="#analytics">
            Analytics
          </a>

          <a href="#materials">
            Materials
          </a>
        </nav>

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
              {teacherType}
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
        <div className="teacher-welcome">
          <div>
            <p className="teacher-label">
              TEACHER DASHBOARD
            </p>

            <h1>
              Welcome back,
              <span>
                {" "}
                {teacherName}.
              </span>
            </h1>

            <p>
              Manage your classes, monitor student
              progress and help your students improve.
            </p>
          </div>

          <button className="teacher-action-button">
            <Bell size={17} />
            Announcements
          </button>
        </div>

        <section className="teacher-overview">
          <div>
            <span>MY CLASSES</span>
            <strong>
              {totalClasses}
            </strong>
          </div>

          <div>
            <span>TOTAL STUDENTS</span>
            <strong>
              {totalStudents}
            </strong>
          </div>

          <div>
            <span>ASSIGNMENTS</span>
            <strong>
              {loadingAssignments
                ? "..."
                : totalAssignments}
            </strong>
          </div>

          <div>
            <span>PENDING TASKS</span>
            <strong>
              {loadingAssignments
                ? "..."
                : totalPendingTasks}
            </strong>
          </div>
        </section>

        <section
          className="teacher-section"
          id="classes"
        >
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                MY CLASSES
              </p>

              <h2>
                Your assigned classes
              </h2>
            </div>

            <Users size={21} />
          </div>

          {loadingClasses ? (
            <div className="teacher-material-panel">
              <div>
                <strong>
                  Loading your classes...
                </strong>

                <p>
                  EDUQUEST is loading the classes
                  assigned to your account.
                </p>
              </div>
            </div>
          ) : classes.length === 0 ? (
            <div className="teacher-material-panel">
              <div>
                <strong>
                  No classes assigned yet
                </strong>

                <p>
                  Your assigned classes will appear
                  here once they are added to your
                  teacher account.
                </p>
              </div>
            </div>
          ) : (
            <div className="teacher-class-grid">
              {classes.map((item) => {
                const studentCount =
                  studentCounts[item.id] || 0;

                const pendingCount =
                  pendingCounts[item.id] || 0;

                return (
                  <div
                    className="teacher-class-card"
                    key={item.id}
                  >
                    <div className="teacher-class-top">
                      <div className="teacher-class-icon">
                        <BookOpen size={22} />
                      </div>

                      <span>
                        {item.subject}
                      </span>
                    </div>

                    <h3>
                      {item.name} - Section{" "}
                      {item.section}
                    </h3>

                    <div className="teacher-class-stats">
                      <div>
                        <span>
                          Students
                        </span>

                        <strong>
                          {studentCount}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Performance
                        </span>

                        <strong>
                          —
                        </strong>
                      </div>

                      <div>
                        <span>
                          Pending
                        </span>

                        <strong>
                          {loadingAssignments
                            ? "..."
                            : pendingCount}
                        </strong>
                      </div>
                    </div>

                    <div className="teacher-performance-bar">
                      <div
                        style={{
                          width: "0%",
                        }}
                      />
                    </div>

                    <a
                      href={`/teacher/classes/${item.id}`}
                      className="teacher-view-button"
                    >
                      View Class
                      <ArrowRight
                        size={16}
                      />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section
          className="teacher-section"
          id="analytics"
        >
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                CLASS INSIGHTS
              </p>

              <h2>
                What needs attention?
              </h2>
            </div>

            <BarChart3 size={21} />
          </div>

          <div className="teacher-insights">
            <div className="teacher-insight-card">
              <div className="teacher-insight-icon">
                <AlertCircle size={20} />
              </div>

              <div>
                <strong>
                  Pending submissions
                </strong>

                <p>
                  {loadingAssignments
                    ? "Checking submitted student work..."
                    : totalPendingTasks > 0
                      ? `${totalPendingTasks} submitted ${
                          totalPendingTasks === 1
                            ? "assignment is"
                            : "assignments are"
                        } waiting for your review.`
                      : "No student submissions are currently waiting for review."}
                </p>
              </div>

              <a
                href="/teacher/assignments"
                className="teacher-insight-link"
              >
                Review →
              </a>
            </div>

            <div className="teacher-insight-card">
              <div className="teacher-insight-icon">
                <FileText size={20} />
              </div>

              <div>
                <strong>
                  Assignment management
                </strong>

                <p>
                  {totalAssignments > 0
                    ? `You currently have ${totalAssignments} ${
                        totalAssignments === 1
                          ? "assignment"
                          : "assignments"
                      } created.`
                    : "You haven't created an assignment yet."}
                </p>
              </div>

              <a
                href="/teacher/assignments"
                className="teacher-insight-link"
              >
                Manage →
              </a>
            </div>
          </div>
        </section>

        <section
          className="teacher-section"
          id="materials"
        >
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-label">
                MATERIALS
              </p>

              <h2>
                Learning resources
              </h2>
            </div>

            <FileText size={21} />
          </div>

          <div className="teacher-material-panel">
            <div>
              <strong>
                Upload learning material
              </strong>

              <p>
                Share PDFs, presentations,
                documents, images and educational
                resources with your assigned classes.
              </p>
            </div>

            <button className="teacher-action-button">
              Upload Material
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}