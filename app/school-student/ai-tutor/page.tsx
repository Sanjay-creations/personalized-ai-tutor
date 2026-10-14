"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Brain,
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

export default function AiTutorPage() {
  const [studentName, setStudentName] = useState("Student");
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("user_id", user.id)
          .single();

        if (error || !profile) {
          console.error(
            "Could not load student profile:",
            error
          );

          window.location.href = "/login";
          return;
        }

        if (profile.role !== "SCHOOL_STUDENT") {
          window.location.href = "/";
          return;
        }

        setStudentName(profile.full_name || "Student");
        setCheckingAccess(false);
      } catch (error) {
        console.error(
          "AI Tutor access error:",
          error
        );

        window.location.href = "/login";
      }
    }

    loadProfile();
  }, []);

  async function askTutor() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loadingResponse) {
      return;
    }

    setErrorMessage("");

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedQuestion,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedMessages);
    setQuestion("");
    setLoadingResponse(true);

    try {
      const response = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to get a response from the AI Tutor."
        );
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error) {
      console.error(
        "AI Tutor request failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );

      setMessages((currentMessages) =>
        currentMessages.filter(
          (message, index) =>
            !(
              index === currentMessages.length - 1 &&
              message.role === "user" &&
              message.content === trimmedQuestion
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
    askTutor();
  }

  function useExampleQuestion() {
    setQuestion(
      "Explain photosynthesis in simple words."
    );
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

  if (checkingAccess) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-content">
          <p className="dashboard-label">
            EDUQUEST
          </p>

          <h1>
            Loading your AI Tutor...
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
            <Brain size={21} />
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
            <LogOut size={15} />

            {loggingOut
              ? "Signing Out..."
              : "Sign Out"}
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="welcome">
          <p className="dashboard-label">
            AI TUTOR
          </p>

          <h1>
            Ask anything.
            <span> Learn better.</span>
          </h1>

          <p>
            Ask questions about your subjects and get
            explanations designed to help you understand.
          </p>
        </div>

        <div className="ai-tutor-box">
          <div className="ai-tutor-heading">
            <div className="ai-tutor-icon">
              <Sparkles size={25} />
            </div>

            <div>
              <h2>EDUQUEST AI Tutor</h2>
              <p>Your learning assistant</p>
            </div>
          </div>

          <div className="ai-chat-area">
            {messages.length === 0 ? (
              <div className="ai-welcome">
                <Brain size={32} />

                <h3>
                  How can I help you learn?
                </h3>

                <p>
                  Ask me about mathematics, science,
                  programming, English or another subject.
                </p>

                <button
                  type="button"
                  className="example-question"
                  onClick={useExampleQuestion}
                >
                  “Explain photosynthesis in simple words.”
                </button>
              </div>
            ) : (
              <div className="ai-messages">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`ai-message ${
                      message.role === "user"
                        ? "ai-message-user"
                        : "ai-message-assistant"
                    }`}
                  >
                    <div className="ai-message-icon">
                      {message.role === "user" ? (
                        <User size={15} />
                      ) : (
                        <Sparkles size={15} />
                      )}
                    </div>

                    <div className="ai-message-content">
                      <span>
                        {message.role === "user"
                          ? studentName
                          : "EDUQUEST AI Tutor"}
                      </span>

                      <p>{message.content}</p>
                    </div>
                  </div>
                ))}

                {loadingResponse && (
                  <div className="ai-message ai-message-assistant">
                    <div className="ai-message-icon">
                      <Sparkles size={15} />
                    </div>

                    <div className="ai-message-content">
                      <span>
                        EDUQUEST AI Tutor
                      </span>

                      <p className="ai-thinking">
                        <Loader2
                          size={14}
                          className="spin"
                        />
                        Thinking...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="ai-error">
              <strong>AI Tutor error</strong>
              <p>{errorMessage}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="ai-input-area"
          >
            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              placeholder="Ask your learning question..."
              rows={4}
              disabled={loadingResponse}
            />

            <button
              type="submit"
              disabled={
                loadingResponse ||
                !question.trim()
              }
            >
              {loadingResponse ? (
                <>
                  <Loader2
                    size={17}
                    className="spin"
                  />
                  Thinking...
                </>
              ) : (
                <>
                  Ask Tutor
                  <Send size={17} />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}