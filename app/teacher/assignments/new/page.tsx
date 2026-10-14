"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  GraduationCap,
  Loader2,
  LogOut,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type TeacherClass = {
  id: number;
  name: string;
  subject: string;
  section: string;
};

export default function NewAssignmentPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [teacherName, setTeacherName] = useState("Teacher");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxPoints, setMaxPoints] = useState("100");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
          return;
        }

        const loadedClasses =
          (teacherClasses as TeacherClass[]) || [];

        setClasses(loadedClasses);

        if (loadedClasses.length > 0) {
          setClassId(String(loadedClasses[0].id));
        }
      } catch (error) {
        console.error(
          "New assignment loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadTeacherData();
  }, []);

  async function handleCreateAssignment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (!title.trim()) {
      setMessage("Please enter an assignment title.");
      return;
    }

    if (!classId) {
      setMessage("Please select a class.");
      return;
    }

    const points = Number(maxPoints);

    if (!Number.isFinite(points) || points <= 0) {
      setMessage("Maximum points must be greater than 0.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: assignment, error } = await supabase
        .from("assignments")
        .insert({
          teacher_id: user.id,
          class_id: Number(classId),
          title: title.trim(),
          description: description.trim(),
          due_date: dueDate
            ? new Date(dueDate).toISOString()
            : null,
          max_points: points,
        })
        .select()
        .single();

      if (error) {
        console.error(
          "Could not create assignment:",
          error
        );
        setMessage(error.message);
        return;
      }

      console.log("Assignment created:", assignment);

      setMessage("Assignment created successfully.");

      setTitle("");
      setDescription("");
      setDueDate("");
      setMaxPoints("100");

      if (classes.length > 0) {
        setClassId(String(classes[0].id));
      }
    } catch (error) {
      console.error(
        "Assignment creation error:",
        error
      );
      setMessage(
        "Something went wrong while creating the assignment."
      );
    } finally {
      setSaving(false);
    }
  }

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
          <h1>Loading assignment workspace...</h1>
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
          >
            <LogOut size={15} />
            Sign Out
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
              Create a new
              <span> assignment.</span>
            </h1>

            <p>
              Create work for one of your assigned classes.
            </p>
          </div>
        </div>

        <section className="assignment-form-panel">
          <div className="assignment-form-icon">
            <FileText size={23} />
          </div>

          <form
            onSubmit={handleCreateAssignment}
            className="assignment-form"
          >
            <div className="assignment-field">
              <label htmlFor="classId">
                Class
              </label>

              {classes.length === 0 ? (
                <div className="assignment-empty">
                  <strong>No classes assigned</strong>
                  <p>
                    You need an assigned class before you
                    can create an assignment.
                  </p>
                </div>
              ) : (
                <select
                  id="classId"
                  value={classId}
                  onChange={(event) =>
                    setClassId(event.target.value)
                  }
                  required
                >
                  {classes.map((teacherClass) => (
                    <option
                      key={teacherClass.id}
                      value={teacherClass.id}
                    >
                      {teacherClass.name} - Section{" "}
                      {teacherClass.section} ·{" "}
                      {teacherClass.subject}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="assignment-field">
              <label htmlFor="title">
                Assignment title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Algebra Practice"
                required
              />
            </div>

            <div className="assignment-field">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe what students need to complete..."
                rows={6}
              />
            </div>

            <div className="assignment-two-column">
              <div className="assignment-field">
                <label htmlFor="dueDate">
                  Due date
                </label>

                <div className="assignment-input-with-icon">
                  <CalendarDays size={17} />

                  <input
                    id="dueDate"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(event) =>
                      setDueDate(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="assignment-field">
                <label htmlFor="maxPoints">
                  Maximum points
                </label>

                <input
                  id="maxPoints"
                  type="number"
                  min="1"
                  value={maxPoints}
                  onChange={(event) =>
                    setMaxPoints(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            {message && (
              <div className="assignment-message">
                {message}
              </div>
            )}

            <div className="assignment-form-actions">
              <a
                href="/teacher"
                className="secondary-button"
              >
                Cancel
              </a>

              <button
                type="submit"
                className="teacher-action-button"
                disabled={
                  saving || classes.length === 0
                }
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    Create Assignment
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}