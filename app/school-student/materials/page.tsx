"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type StudentMaterial = {
  id: string;
  class_id: number;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
};

export default function StudentMaterialsPage() {
  const [studentName, setStudentName] = useState("Student");
  const [materials, setMaterials] = useState<StudentMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingFile, setOpeningFile] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadMaterials() {
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

        const {
          data: memberships,
          error: membershipsError,
        } = await supabase
          .from("class_members")
          .select("class_id")
          .eq("student_id", user.id);

        if (membershipsError) {
          console.error(
            "Could not load class memberships:",
            membershipsError
          );
          setMaterials([]);
          return;
        }

        const classIds = (memberships || []).map(
          (membership) => membership.class_id
        );

        if (classIds.length === 0) {
          setMaterials([]);
          return;
        }

        const {
          data: materialData,
          error: materialsError,
        } = await supabase
          .from("materials")
          .select(
            "id, class_id, title, description, file_path, file_name, file_type, file_size, created_at"
          )
          .in("class_id", classIds)
          .order("created_at", {
            ascending: false,
          });

        if (materialsError) {
          console.error(
            "Could not load student materials:",
            materialsError
          );
          setMaterials([]);
          return;
        }

        setMaterials(
          (materialData as StudentMaterial[]) || []
        );
      } catch (error) {
        console.error(
          "Student materials error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadMaterials();
  }, []);

  async function openMaterial(material: StudentMaterial) {
    setMessage("");
    setOpeningFile(material.id);

    try {
      const { data, error } = await supabase.storage
        .from("teacher-materials")
        .createSignedUrl(material.file_path, 60 * 10);

      if (error || !data?.signedUrl) {
        console.error(
          "Could not create signed URL:",
          error
        );

        setMessage(
          "Could not open this material. Please try again."
        );
        return;
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error(
        "Material opening error:",
        error
      );

      setMessage(
        "Something went wrong while opening the material."
      );
    } finally {
      setOpeningFile(null);
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

  function formatFileSize(size: number | null) {
    if (!size) {
      return "Unknown size";
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileLabel(fileType: string) {
    if (fileType === "application/pdf") {
      return "PDF";
    }

    if (fileType === "image/png") {
      return "PNG";
    }

    if (fileType === "image/jpeg") {
      return "JPEG";
    }

    if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      return "PPTX";
    }

    if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return "DOCX";
    }

    return "FILE";
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-content">
          <p className="dashboard-label">
            EDUQUEST
          </p>

          <h1>
            Loading your learning materials...
          </h1>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a
          href="/school-student"
          className="back-button"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </a>

        <div className="dashboard-brand">
          <div className="dashboard-logo">
            <BookOpen size={21} />
          </div>

          <span>EDUQUEST</span>
        </div>

        <div className="student-profile">
          <div className="avatar">
            {studentName
              .charAt(0)
              .toUpperCase()}
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
            LEARNING MATERIALS
          </p>

          <h1>
            Learn from
            <span> your teachers.</span>
          </h1>

          <p>
            Access notes, documents, presentations and
            other resources shared with your classes.
          </p>
        </div>

        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}

        {materials.length === 0 ? (
          <section className="progress-panel">
            <div className="progress-panel-heading">
              <div>
                <p className="dashboard-label">
                  MATERIALS
                </p>

                <h2>
                  No materials yet
                </h2>
              </div>

              <FileText size={20} />
            </div>

            <p
              style={{
                marginTop: "15px",
                color: "#778398",
                fontSize: "11px",
                lineHeight: 1.7,
              }}
            >
              Your teacher's learning resources will
              appear here when they are shared with your
              classes.
            </p>
          </section>
        ) : (
          <div className="student-material-grid">
            {materials.map((material) => (
              <article
                className="student-material-card"
                key={material.id}
              >
                <div className="student-material-top">
                  <div className="student-material-icon">
                    <FileText size={22} />
                  </div>

                  <span>
                    {getFileLabel(
                      material.file_type
                    )}
                  </span>
                </div>

                <h2>
                  {material.title}
                </h2>

                <p>
                  {material.description ||
                    "No description provided."}
                </p>

                <div className="student-material-meta">
                  <div>
                    <FileText size={15} />

                    <span>
                      {material.file_name}
                    </span>
                  </div>

                  <div>
                    <Download size={15} />

                    <span>
                      {formatFileSize(
                        material.file_size
                      )}
                    </span>
                  </div>

                  <div>
                    <GraduationCap size={15} />

                    <span>
                      Shared with your class
                    </span>
                  </div>
                </div>

                <button
                  className="primary-button"
                  onClick={() =>
                    openMaterial(material)
                  }
                  disabled={
                    openingFile === material.id
                  }
                >
                  {openingFile === material.id ? (
                    <>
                      <Loader2
                        size={17}
                        className="spin"
                      />
                      Opening...
                    </>
                  ) : (
                    <>
                      Open Material
                      <ExternalLink size={17} />
                    </>
                  )}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}