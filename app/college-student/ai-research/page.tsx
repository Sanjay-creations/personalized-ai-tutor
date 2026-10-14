"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  FileText,
  GraduationCap,
  Loader2,
  LogOut,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Course = {
  id: number;
  title: string;
  code: string;
};

export default function CollegeAiResearchPage() {
  const [studentName, setStudentName] =
    useState("College Student");

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [selectedCourseId, setSelectedCourseId] =
    useState("");

  const [researchTopic, setResearchTopic] =
    useState("");

  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [loadingResponse, setLoadingResponse] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    async function loadStudentData() {
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
          profile.full_name ||
            "College Student"
        );

        const {
          data: memberships,
          error: membershipError,
        } = await supabase
          .from("course_members")
          .select("course_id")
          .eq("student_id", user.id);

        if (membershipError) {
          console.error(
            "Could not load course memberships:",
            membershipError
          );

          setCourses([]);
          return;
        }

        const courseIds =
          (memberships || []).map(
            (membership) =>
              membership.course_id
          );

        if (courseIds.length === 0) {
          setCourses([]);
          return;
        }

        const {
          data: courseData,
          error: coursesError,
        } = await supabase
          .from("courses")
          .select(
            "id, title, code"
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

        const loadedCourses =
          (courseData as Course[]) ||
          [];

        setCourses(
          loadedCourses
        );

        if (loadedCourses.length > 0) {
          setSelectedCourseId(
            String(
              loadedCourses[0].id
            )
          );
        }
      } catch (error) {
        console.error(
          "College AI Research access error:",
          error
        );
      } finally {
        setCheckingAccess(false);
        setLoadingCourses(false);
      }
    }

    loadStudentData();
  }, []);

  async function askResearchAssistant() {
    const trimmedQuestion =
      question.trim();

    if (
      !trimmedQuestion ||
      loadingResponse
    ) {
      return;
    }

    setErrorMessage("");

    const selectedCourse =
      courses.find(
        (course) =>
          String(course.id) ===
          selectedCourseId
      );

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedQuestion,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(
      updatedMessages
    );

    setQuestion("");
    setLoadingResponse(true);

    try {
      const response =
        await fetch(
          "/api/ai-tutor",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              messages:
                updatedMessages,
              context: {
                subject:
                  selectedCourse?.title ||
                  "College Studies",
                topic:
                  researchTopic ||
                  "General Research",
                courseId:
                  selectedCourse?.id ||
                  null,
                courseCode:
                  selectedCourse?.code ||
                  null,
              },
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to get a response from the Research Assistant."
        );
      }

      setMessages(
        (currentMessages) => [
          ...currentMessages,
          {
            role: "assistant",
            content:
              data.answer,
          },
        ]
      );
    } catch (error) {
      console.error(
        "Research Assistant request failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );

      setMessages(
        (currentMessages) =>
          currentMessages.filter(
            (message, index) =>
              !(
                index ===
                  currentMessages.length -
                    1 &&
                message.role ===
                  "user" &&
                message.content ===
                  trimmedQuestion
              )
          )
      );
    } finally {
      setLoadingResponse(false);
    }
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    askResearchAssistant();
  }

  function useExampleQuestion() {
    setResearchTopic(
      "Object-Oriented Programming"
    );

    setQuestion(
      "Explain the difference between inheritance and polymorphism with a practical example."
    );
  }

  function startNewResearchSession() {
    setMessages([]);
    setQuestion("");
    setResearchTopic("");
    setErrorMessage("");
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

    window.location.href =
      "/login";
  }

  if (checkingAccess) {
    return (
      <main className="college-page">
        <section className="college-main">
          <p className="college-label">
            EDUQUEST
          </p>

          <h1>
            Loading your research workspace...
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

          <a href="/college-student/ai-research">
            AI Research
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
              onClick={
                handleLogout
              }
              disabled={
                loggingOut
              }
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
              AI RESEARCH ASSISTANT
            </p>

            <h1>
              Research smarter.
              <span>
                {" "}
                Think deeper.
              </span>
            </h1>

            <p>
              Explore concepts, understand difficult
              topics, organize ideas and learn with an
              AI-powered research assistant.
            </p>
          </div>
        </div>

        <section className="college-research-box">
          <div className="college-research-header">
            <div className="college-research-title">
              <div className="college-research-icon">
                <Sparkles size={24} />
              </div>

              <div>
                <p className="college-label">
                  EDUQUEST AI
                </p>

                <h2>
                  Research Assistant
                </h2>

                <span>
                  Your academic thinking partner
                </span>
              </div>
            </div>

            <button
              type="button"
              className="college-research-new-button"
              onClick={
                startNewResearchSession
              }
            >
              New Session
            </button>
          </div>

          <div className="college-research-context">
            <div>
              <label htmlFor="research-course">
                Course
              </label>

              <select
                id="research-course"
                value={
                  selectedCourseId
                }
                onChange={(
                  event
                ) =>
                  setSelectedCourseId(
                    event.target.value
                  )
                }
                disabled={
                  loadingResponse ||
                  loadingCourses
                }
              >
                {courses.length ===
                0 ? (
                  <option value="">
                    No enrolled courses
                  </option>
                ) : (
                  courses.map(
                    (course) => (
                      <option
                        key={
                          course.id
                        }
                        value={
                          course.id
                        }
                      >
                        {
                          course.title
                        }{" "}
                        ·{" "}
                        {
                          course.code
                        }
                      </option>
                    )
                  )
                )}
              </select>
            </div>

            <div>
              <label htmlFor="research-topic">
                Research topic
              </label>

              <input
                id="research-topic"
                type="text"
                value={
                  researchTopic
                }
                onChange={(
                  event
                ) =>
                  setResearchTopic(
                    event.target.value
                  )
                }
                placeholder="e.g. Polymorphism in Java"
                disabled={
                  loadingResponse
                }
              />
            </div>
          </div>

          <div className="college-research-chat">
            {messages.length ===
            0 ? (
              <div className="college-research-welcome">
                <Brain size={35} />

                <h3>
                  What are you researching?
                </h3>

                <p>
                  Choose your course, enter a research
                  topic and ask a detailed question.
                </p>

                <button
                  type="button"
                  className="college-example-question"
                  onClick={
                    useExampleQuestion
                  }
                >
                  Try an example →
                </button>
              </div>
            ) : (
              <div className="college-research-messages">
                {messages.map(
                  (
                    message,
                    index
                  ) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`college-research-message ${
                        message.role ===
                        "user"
                          ? "college-research-user"
                          : "college-research-assistant"
                      }`}
                    >
                      <div className="college-research-avatar">
                        {message.role ===
                        "user" ? (
                          <User
                            size={15}
                          />
                        ) : (
                          <Sparkles
                            size={15}
                          />
                        )}
                      </div>

                      <div className="college-research-message-content">
                        <span>
                          {message.role ===
                          "user"
                            ? studentName
                            : "EDUQUEST AI"}
                        </span>

                        <p>
                          {
                            message.content
                          }
                        </p>
                      </div>
                    </div>
                  )
                )}

                {loadingResponse && (
                  <div className="college-research-message college-research-assistant">
                    <div className="college-research-avatar">
                      <Sparkles
                        size={15}
                      />
                    </div>

                    <div className="college-research-message-content">
                      <span>
                        EDUQUEST AI
                      </span>

                      <p className="college-research-thinking">
                        <Loader2
                          size={14}
                          className="spin"
                        />
                        Analyzing...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="college-research-error">
              <strong>
                Research Assistant error
              </strong>

              <p>
                {errorMessage}
              </p>
            </div>
          )}

          <form
            className="college-research-input"
            onSubmit={
              handleSubmit
            }
          >
            <textarea
              value={question}
              onChange={(
                event
              ) =>
                setQuestion(
                  event.target.value
                )
              }
              placeholder="Ask a research question..."
              rows={5}
              disabled={
                loadingResponse
              }
            />

            <button
              type="submit"
              disabled={
                loadingResponse ||
                !question.trim() ||
                courses.length === 0
              }
            >
              {loadingResponse ? (
                <>
                  <Loader2
                    size={17}
                    className="spin"
                  />
                  Analyzing...
                </>
              ) : (
                <>
                  Research with AI
                  <Send size={17} />
                </>
              )}
            </button>
          </form>
        </section>

        <section className="college-bottom-grid">
          <div className="college-panel">
            <div className="college-panel-heading">
              <div>
                <p className="college-label">
                  RESEARCH TOOLS
                </p>

                <h2>
                  Work smarter
                </h2>
              </div>

              <BookOpen size={21} />
            </div>

            <div className="college-research-tip">
              <Brain size={20} />

              <div>
                <strong>
                  Ask for explanations
                </strong>

                <p>
                  Ask the assistant to explain complex
                  ideas at different levels of difficulty.
                </p>
              </div>
            </div>

            <div className="college-research-tip">
              <FileText size={20} />

              <div>
                <strong>
                  Summarize concepts
                </strong>

                <p>
                  Turn difficult material into structured
                  notes and concise explanations.
                </p>
              </div>
            </div>
          </div>

          <div className="college-panel">
            <div className="college-panel-heading">
              <div>
                <p className="college-label">
                  COURSE CONTEXT
                </p>

                <h2>
                  Current focus
                </h2>
              </div>

              <GraduationCap size={21} />
            </div>

            <div className="college-research-course-info">
              {loadingCourses ? (
                <p>
                  Loading enrolled courses...
                </p>
              ) : courses.length ===
                0 ? (
                <p>
                  No enrolled courses found.
                </p>
              ) : (
                <>
                  <span>
                    SELECTED COURSE
                  </span>

                  <strong>
                    {
                      courses.find(
                        (course) =>
                          String(
                            course.id
                          ) ===
                          selectedCourseId
                      )?.title
                    }
                  </strong>

                  <small>
                    {
                      courses.find(
                        (course) =>
                          String(
                            course.id
                          ) ===
                          selectedCourseId
                      )?.code
                    }
                  </small>
                </>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}