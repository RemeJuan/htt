import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { env, supabaseKey } from "@/lib/env";

export type PublicListing = Pick<
  Database["public"]["Tables"]["listings"]["Row"],
  "name" | "slug" | "platforms" | "urls" | "website_url" | "description"
>;

function isPublicListing(value: unknown): value is PublicListing {
  if (!value || typeof value !== "object") return false;

  const listing = value as Record<string, unknown>;

  return (
    typeof listing.name === "string" &&
    listing.name.length > 0 &&
    typeof listing.slug === "string" &&
    Array.isArray(listing.platforms) &&
    typeof listing.urls === "object" &&
    (typeof listing.website_url === "string" || listing.website_url === null) &&
    (typeof listing.description === "string" || listing.description === null)
  );
}

export function sanitizePublicListings(data: unknown): PublicListing[] {
  return Array.isArray(data) ? data.filter(isPublicListing) : [];
}

export function sanitizePublicListing(data: unknown): PublicListing | null {
  return isPublicListing(data) ? data : null;
}

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
      .select("name, slug, platforms, urls, website_url, description")
      .eq("status", "published")
      .order("created_at", { ascending: sort === "oldest" });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (platform) {
      query = query.contains("platforms", [platform]);
    }

    const { data, error } = await query;

    if (error) {
      return [];
    }

    return sanitizePublicListings(data);
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
      .select("name, slug, platforms, urls, website_url, description")
      .eq("status", "published")
      .eq("slug", canonicalSlug)
      .maybeSingle();

    if (error) {
      return null;
    }

    return sanitizePublicListing(data);
  } catch {
    return null;
  }
}
