"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { getAuthCallbackUrl } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signedUp, setSignedUp] = useState(false);

  const isSignup = mode === "signup";
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const switchAuthHref = `${isSignup ? "/login" : "/signup"}?next=${encodeURIComponent(safeNext)}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setSignedUp(false);

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
              emailRedirectTo: getAuthCallbackUrl(safeNext),
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
        setSignedUp(true);
        return;
      }

      router.replace(safeNext);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Supabase auth is not configured.");
      return;
    } finally {
      setLoading(false);
    }
  }

  if (isSignup && signedUp) {
    return (
      <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-base font-medium">Check your email to confirm your account</p>
      </div>
    );
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

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="mr-2 inline-flex size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {isSignup ? "Creating account..." : "Logging in..."}
          </>
        ) : isSignup ? (
          "Create account"
        ) : (
          "Log in"
        )}
      </button>
      <p className="text-sm text-muted-foreground">
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          href={switchAuthHref}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {isSignup ? "Log in" : "Sign up"}
        </Link>
      </p>
    </form>
  );
}
