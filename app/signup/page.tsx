"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Loader2,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const ALLOWED_ROLES = [
  "SCHOOL_STUDENT",
  "COLLEGE_STUDENT",
] as const;

type StudentRole = (typeof ALLOWED_ROLES)[number];

export default function SignupPage() {
  const searchParams = useSearchParams();

  const requestedRole = searchParams.get("role");

  const initialRole: StudentRole =
    requestedRole === "COLLEGE_STUDENT"
      ? "COLLEGE_STUDENT"
      : "SCHOOL_STUDENT";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<StudentRole>(initialRole);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setMessage("Please enter your full name.");
      return;
    }

    if (!ALLOWED_ROLES.includes(role)) {
      setMessage("Invalid account type.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (!cleanEmail) {
      setMessage("Please enter your email address.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          role,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Account created successfully. Check your email for a confirmation link, then sign in."
    );

    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setLoading(false);
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <a href="/" className="auth-brand">
        <div className="auth-brand-icon">
          <Sparkles size={20} />
        </div>

        <span>EDUQUEST</span>
      </a>

      <section className="auth-card">
        <a href="/" className="back-button">
          <ArrowLeft size={16} />
          Back to EDUQUEST
        </a>

        <div className="auth-icon signup-icon">
          <Brain size={30} />
        </div>

        <p className="auth-label">
          CREATE YOUR ACCOUNT
        </p>

        <h1>Join EDUQUEST</h1>

        <p className="auth-subtitle">
          Start your personalized learning journey.
        </p>

        <form
          onSubmit={handleSignup}
          className="auth-form"
        >
          <label htmlFor="role">
            Account type
          </label>

          <select
            id="role"
            value={role}
            onChange={(event) =>
              setRole(
                event.target.value as StudentRole
              )
            }
            className="auth-select"
            required
          >
            <option value="SCHOOL_STUDENT">
              School Student
            </option>

            <option value="COLLEGE_STUDENT">
              College Student
            </option>
          </select>

          <label htmlFor="fullName">
            Full name
          </label>

          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            placeholder="Your full name"
            autoComplete="name"
            required
          />

          <label htmlFor="email">
            Email address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Create a password"
            autoComplete="new-password"
            minLength={6}
            required
          />

          <label htmlFor="confirmPassword">
            Confirm password
          </label>

          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            placeholder="Confirm your password"
            autoComplete="new-password"
            minLength={6}
            required
          />

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="spin"
                />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <a href="/login">Sign in</a>
        </p>
      </section>
    </main>
  );
}