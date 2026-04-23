import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const seedUser = {
  email: "seed.listings@example.com",
  password: "SeedListings123!",
  email_confirm: true,
  user_metadata: {
    username: "seed-listings",
    display_name: "Seed Listings",
  },
};

export function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function findUserByEmail(supabase, email) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    const user = data.users.find((item) => item.email === email);
    if (user) return user;
    if (data.users.length < 100) return null;

    page += 1;
  }
}

export async function getOrCreateSeedUser(supabase) {
  const existing = await findUserByEmail(supabase, seedUser.email);
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser(seedUser);
  if (error) throw error;

  return data.user;
}

export async function upsertSeedProfile(supabase, user) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username: seedUser.user_metadata.username,
      display_name: seedUser.user_metadata.display_name,
      avatar_url: null,
    },
    { onConflict: "id" },
  );

  if (error) throw error;
}

export { seedUser };
