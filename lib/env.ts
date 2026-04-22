export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export const supabaseKey = env.supabasePublishableKey || env.supabaseAnonKey;

export const hasSupabaseEnv =
  env.supabaseUrl.length > 0 && supabaseKey.length > 0;
