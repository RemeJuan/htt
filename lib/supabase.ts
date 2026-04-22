import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env, hasSupabaseEnv } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

export const isSupabaseConfigured = hasSupabaseEnv;

export function getSupabaseBrowserClient() {
  if (!hasSupabaseEnv) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  if (!browserClient) {
    browserClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  return browserClient;
}
