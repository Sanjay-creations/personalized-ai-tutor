"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Brain, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const user = await supabase.auth.getUser();

if (user.data.user) {
  const role = user.data.user.user_metadata?.role;

  if (role === "SCHOOL_STUDENT") {
    window.location.href = "/school-student";
  } else if (role === "COLLEGE_STUDENT") {
    window.location.href = "/college-student";
  } else if (
    role === "SCHOOL_TEACHER" ||
    role === "COLLEGE_TEACHER"
  ) {
    window.location.href = "/teacher";
  } else {
    window.location.href = "/";
  }
}
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
        <div className="auth-icon">
          <Brain size={30} />
        </div>

        <p className="auth-label">WELCOME BACK</p>

        <h1>Login to EDUQUEST</h1>

        <p className="auth-subtitle">
          Continue your learning journey.
        </p>

        <form onSubmit={handleLogin} className="auth-form">
          <label htmlFor="email">Email address</label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />

          {message && <div className="auth-message">{message}</div>}

          <button type="submit" className="primary-button auth-submit">
            {loading ? (
              <>
                <Loader2 size={17} className="spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          New to EDUQUEST?{" "}
          <a href="/signup">Create an account</a>
        </p>
      </section>
    </main>
  );
}