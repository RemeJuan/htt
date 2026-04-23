import "server-only";

import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function requireAuthenticatedUser(nextPath: string) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}
