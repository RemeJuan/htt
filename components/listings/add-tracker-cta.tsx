"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase";

export const CREATE_TRACKER_ROUTE = "/dashboard/listings/new";
export const LOGIN_TO_CREATE_TRACKER_ROUTE = `/login?next=${encodeURIComponent(CREATE_TRACKER_ROUTE)}`;

export function AddTrackerCta() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(false);

  async function handleClick() {
    setCheckingAuth(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      router.push(error || !user ? LOGIN_TO_CREATE_TRACKER_ROUTE : CREATE_TRACKER_ROUTE);
    } catch {
      router.push(LOGIN_TO_CREATE_TRACKER_ROUTE);
    } finally {
      setCheckingAuth(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={checkingAuth}
      className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {checkingAuth ? "Checking..." : "Add tracker"}
    </button>
  );
}
