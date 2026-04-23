import { pathToFileURL } from "node:url";

import { createSupabaseClient, getOrCreateSeedUser, upsertSeedProfile } from "./lib.mjs";

async function loadDraftIosListings(supabase, userId) {
  const { data, error } = await supabase
    .from("listings")
    .select("id, slug, status, platforms, user_id")
    .eq("user_id", userId)
    .eq("status", "draft")
    .contains("platforms", ["iOS"])
    .order("slug", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function main() {
  const supabase = createSupabaseClient();
  const user = await getOrCreateSeedUser(supabase);
  await upsertSeedProfile(supabase, user);

  const listings = await loadDraftIosListings(supabase, user.id);
  let updated = 0;

  for (const listing of listings) {
    const { error } = await supabase
      .from("listings")
      .update({ status: "published" })
      .eq("id", listing.id)
      .eq("user_id", user.id)
      .eq("status", "draft");

    if (error) {
      throw error;
    }

    updated += 1;
  }

  console.log(`published=${updated} user=${user.id}`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
