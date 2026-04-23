"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { hasSupabaseEnv } from "@/lib/env";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Completing sign in...");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const params = new URLSearchParams(window.location.search);
    const authCode = params.get("code") ?? "";
    const authError = params.get("error") ?? params.get("error_description") ?? "";
    const next = params.get("next") ?? "/dashboard";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    const linkedProvider = params.get("linked") ?? "";

    if (authError) {
      void Promise.resolve().then(() => {
        if (!active) return;
        setStatus("Sign in failed.");
        setError(authError);
      });
      return () => {
        active = false;
      };
    }

    if (!authCode) {
      void Promise.resolve().then(() => {
        if (!active) {
          return;
        }

        setStatus("Missing sign-in code.");
        setError("Open the login page and try again.");
      });
      return () => {
        active = false;
      };
    }

    if (!hasSupabaseEnv) {
      void Promise.resolve().then(() => {
        if (!active) {
          return;
        }

        setStatus("Supabase env missing.");
        setError("Set the public Supabase env vars in your deployment environment.");
      });
      return () => {
        active = false;
      };
    }

    async function completeSignIn() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);

        if (!active) {
          return;
        }

        if (exchangeError) {
          setStatus("Sign in failed.");
          setError(exchangeError.message);
          return;
        }

        if (linkedProvider) {
          setStatus(`${linkedProvider === "github" ? "GitHub" : linkedProvider} connected.`);
        }

        router.replace(safeNext);
        router.refresh();
      } catch (authError) {
        if (!active) {
          return;
        }

        setStatus("Sign in failed.");
        setError(authError instanceof Error ? authError.message : "Unable to complete sign in.");
      }
    }

    void completeSignIn();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md flex-col justify-center py-10">
      <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">Auth callback</h1>
        <p className="text-sm text-muted-foreground">{status}</p>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Link
          href="/login"
          className="inline-flex text-sm font-medium underline underline-offset-4"
        >
          Back to login
        </Link>
      </div>
    </section>
  );
}
