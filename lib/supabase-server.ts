import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import { env, supabaseKey } from "@/lib/env";

function ensureSupabaseEnv() {
  if (!env.supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase env vars.");
  }

  return {
    supabaseUrl: env.supabaseUrl,
    supabaseKey,
  };
}

export async function getSupabaseServerClient() {
  const { supabaseUrl, supabaseKey: key } = ensureSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Read-only during server render.
        }
      },
    },
  });
}
