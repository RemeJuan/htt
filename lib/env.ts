export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
};

export const supabaseKey = env.supabasePublishableKey || env.supabaseAnonKey;

export const hasSupabaseEnv = env.supabaseUrl.length > 0 && supabaseKey.length > 0;

export function getCanonicalSiteUrl() {
  if (!env.siteUrl) {
    throw new Error("Missing site URL. Set NEXT_PUBLIC_SITE_URL in .env.local.");
  }

  try {
    return new URL(env.siteUrl).origin;
  } catch {
    throw new Error("Invalid site URL. Set NEXT_PUBLIC_SITE_URL to a valid absolute URL.");
  }
}

export function getAuthCallbackUrl(next: string) {
  return new URL(
    `/auth/callback/?next=${encodeURIComponent(next)}`,
    getCanonicalSiteUrl(),
  ).toString();
}
