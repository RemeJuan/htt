import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { env, supabaseKey } from "@/lib/env";

export type PublicListing = Pick<Database["public"]["Tables"]["listings"]["Row"], "name" | "slug" | "platform" | "description" | "url">;

function createPublicClient() {
  if (!env.supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase env vars.");
  }

  return createClient<Database>(env.supabaseUrl, supabaseKey);
}

export async function getPublishedListings(params?: {
  search?: string;
  platform?: string;
  sort?: "newest" | "oldest";
}): Promise<PublicListing[]> {
  try {
    const supabase = createPublicClient();
    const search = params?.search?.trim();
    const platform = params?.platform?.trim();
    const sort = params?.sort === "oldest" ? "oldest" : "newest";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = supabase.from("listings") as any;
    query = query
      .select("name, slug, platform, description, url")
      .eq("status", "published")
      .order("created_at", { ascending: sort === "oldest" });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (platform) {
      query = query.ilike("platform", `%${platform}%`);
    }

    const { data, error } = await query;

    if (error) {
      return [];
    }

    return data ?? [];
  } catch {
    return [];
  }
}

export async function getPublishedListingBySlug(slug: string): Promise<PublicListing | null> {
  try {
    const supabase = createPublicClient();
    const canonicalSlug = slug.trim().toLowerCase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listings = supabase.from("listings") as any;
    const { data, error } = await listings
      .select("name, slug, platform, description, url")
      .eq("status", "published")
      .eq("slug", canonicalSlug)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
