"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getSupabaseBrowserClient } from "@/lib/supabase";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const result = isSignup
        ? await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              emailRedirectTo: new URL(
                "/auth/callback?next=/dashboard",
                window.location.origin,
              ).toString(),
            },
          })
        : await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (isSignup && !result.data.session) {
        setMessage("Check your email to finish sign up.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Supabase auth is not configured.");
      return;
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{isSignup ? "Sign up" : "Log in"}</h1>
        <p className="text-sm text-muted-foreground">
          {isSignup ? "Create an account with email and password." : "Use your email and password."}
        </p>
      </div>

      <label className="block space-y-2 text-sm">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none transition focus:border-foreground"
        />
      </label>

      <label className="block space-y-2 text-sm">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none transition focus:border-foreground"
        />
      </label>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Working..." : isSignup ? "Create account" : "Log in"}
      </button>
      <p className="text-sm text-muted-foreground">
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {isSignup ? "Log in" : "Sign up"}
        </Link>
      </p>
    </form>
  );
}
