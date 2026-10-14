"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  FileText,
  GraduationCap,
  Loader2,
  LogOut,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type TeacherClass = {
  id: number;
  name: string;
  subject: string;
  section: string;
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function TeacherMaterialsPage() {
  const [teacherName, setTeacherName] = useState("Teacher");
  const [classes, setClasses] = useState<TeacherClass[]>([]);

  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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
          setClasses([]);
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
          "Materials page loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadTeacherData();
  }, []);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setMessage("");

    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage(
        "Unsupported file type. Please choose a PDF, PNG, JPEG, DOCX, or PPTX file."
      );
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage(
        "File is too large. Maximum file size is 20 MB."
      );
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    if (!title.trim()) {
      const fileNameWithoutExtension =
        file.name.replace(/\.[^/.]+$/, "");

      setTitle(fileNameWithoutExtension);
    }
  }

  function clearFile() {
    setSelectedFile(null);
    setMessage("");

    const fileInput =
      document.getElementById(
        "material-file"
      ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  }

  async function handleUpload(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (!classId) {
      setMessage("Please select a class.");
      return;
    }

    if (!title.trim()) {
      setMessage("Please enter a material title.");
      return;
    }

    if (!selectedFile) {
      setMessage("Please choose a file to upload.");
      return;
    }

    setUploading(true);

    let uploadedPath = "";

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Verify that the selected class belongs to this teacher.
      const { data: teacherClass, error: classError } =
        await supabase
          .from("classes")
          .select("id")
          .eq("id", Number(classId))
          .eq("teacher_id", user.id)
          .single();

      if (classError || !teacherClass) {
        setMessage(
          "You are not authorized to upload material for this class."
        );
        return;
      }

      const safeFileName = selectedFile.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_");

      const filePath =
        `${user.id}/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

      uploadedPath = filePath;

      const { error: uploadError } =
        await supabase.storage
          .from("teacher-materials")
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: selectedFile.type,
          });

      if (uploadError) {
        console.error(
          "Material upload failed:",
          uploadError
        );
        setMessage(uploadError.message);
        return;
      }

      const { error: materialError } =
        await supabase
          .from("materials")
          .insert({
            teacher_id: user.id,
            class_id: Number(classId),
            title: title.trim(),
            description:
              description.trim() || null,
            file_path: filePath,
            file_name: selectedFile.name,
            file_type: selectedFile.type,
            file_size: selectedFile.size,
          });

      if (materialError) {
        console.error(
          "Could not save material metadata:",
          materialError
        );

        // Remove the file if metadata creation fails.
        await supabase.storage
          .from("teacher-materials")
          .remove([uploadedPath]);

        setMessage(materialError.message);
        return;
      }

      setMessage(
        "Material uploaded successfully."
      );

      setTitle("");
      setDescription("");
      setSelectedFile(null);

      const fileInput =
        document.getElementById(
          "material-file"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error(
        "Material upload error:",
        error
      );

      if (uploadedPath) {
        await supabase.storage
          .from("teacher-materials")
          .remove([uploadedPath]);
      }

      setMessage(
        "Something went wrong while uploading the material."
      );
    } finally {
      setUploading(false);
    }
  }

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
      <main className="teacher-page">
        <section className="teacher-main">
          <p className="teacher-label">
            EDUQUEST
          </p>

          <h1>
            Loading materials workspace...
          </h1>
        </section>
      </main>
    );
  }

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
              LEARNING MATERIALS
            </p>

            <h1>
              Share knowledge with
              <span> your class.</span>
            </h1>

            <p>
              Upload notes, PDFs, presentations,
              documents and other learning resources.
            </p>
          </div>
        </div>

        <section className="assignment-form-panel material-upload-panel">
          <div className="assignment-form-icon">
            <Upload size={23} />
          </div>

          <form
            onSubmit={handleUpload}
            className="assignment-form"
          >
            <div className="assignment-field">
              <label htmlFor="classId">
                Class
              </label>

              {classes.length === 0 ? (
                <div className="assignment-empty">
                  <strong>
                    No classes assigned
                  </strong>

                  <p>
                    You need an assigned class before
                    uploading learning material.
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
                  {classes.map(
                    (teacherClass) => (
                      <option
                        key={teacherClass.id}
                        value={teacherClass.id}
                      >
                        {teacherClass.name} - Section{" "}
                        {teacherClass.section} ·{" "}
                        {teacherClass.subject}
                      </option>
                    )
                  )}
                </select>
              )}
            </div>

            <div className="assignment-field">
              <label htmlFor="title">
                Material title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Algebra Notes"
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
                placeholder="Briefly describe this learning material..."
                rows={5}
              />
            </div>

            <div className="assignment-field">
              <label htmlFor="material-file">
                File
              </label>

              {!selectedFile ? (
                <label
                  htmlFor="material-file"
                  className="material-dropzone"
                >
                  <Upload size={26} />

                  <strong>
                    Choose a file
                  </strong>

                  <span>
                    PDF, PNG, JPEG, DOCX or PPTX ·
                    Maximum 20 MB
                  </span>

                  <input
                    id="material-file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.pptx"
                    onChange={handleFileChange}
                    hidden
                  />
                </label>
              ) : (
                <div className="material-selected-file">
                  <div className="material-file-icon">
                    <FileText size={20} />
                  </div>

                  <div>
                    <strong>
                      {selectedFile.name}
                    </strong>

                    <span>
                      {(
                        selectedFile.size /
                        (1024 * 1024)
                      ).toFixed(2)}{" "}
                      MB
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={clearFile}
                    className="material-remove-file"
                    aria-label="Remove selected file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
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
                  uploading ||
                  classes.length === 0
                }
              >
                {uploading ? (
                  <>
                    <Loader2
                      size={17}
                      className="spin"
                    />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={17} />
                    Upload Material
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