import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { env, hasSupabaseEnv, supabaseKey } from "@/lib/env";

type Cookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  priority?: "low" | "medium" | "high";
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
  partitioned?: boolean;
};

type CookieAdapter = {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (cookiesToSet: Cookie[]) => void;
};

let browserClient: SupabaseClient<Database> | null = null;

function ensureSupabaseEnv() {
  if (!hasSupabaseEnv) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  return {
    supabaseUrl: env.supabaseUrl,
    supabaseKey,
  };
}

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    const { supabaseUrl, supabaseKey: key } = ensureSupabaseEnv();
    browserClient = createBrowserClient<Database>(supabaseUrl, key);
  }

  return browserClient;
}

export function createSupabaseServerClient(cookieAdapter: CookieAdapter) {
  const { supabaseUrl, supabaseKey: key } = ensureSupabaseEnv();

  return createServerClient<Database>(supabaseUrl, key, {
    cookies: {
      getAll: () => cookieAdapter.getAll(),
      setAll: (cookiesToSet) => {
        cookieAdapter.setAll(cookiesToSet);
      },
    },
  });
}
