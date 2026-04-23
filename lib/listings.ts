import "server-only";

import type { ListingInsert, ListingRow, ListingStatus, ListingUpdate } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type ListingInput = {
  name: string;
  slug: string;
  platforms: string[];
  urls: Record<string, string>;
  website_url: string | null;
  description: string | null;
  status: ListingStatus;
  is_claimed: boolean;
};

export type PublicListing = Pick<
  ListingRow,
  "name" | "slug" | "platforms" | "urls" | "website_url" | "description"
>;

function normalizeListingSlug(slug: string) {
  return slug.trim().toLowerCase();
}

export async function getOwnListings(userId: string): Promise<ListingRow[]> {
  const supabase = await getSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings = supabase.from("listings") as any;
  const { data, error } = await listings
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getPublishedListings(params?: {
  search?: string;
  platform?: string;
  sort?: "newest" | "oldest";
}): Promise<PublicListing[]> {
  const supabase = await getSupabaseServerClient();
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
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getPublishedListingBySlug(slug: string): Promise<PublicListing | null> {
  const supabase = await getSupabaseServerClient();
  const canonicalSlug = normalizeListingSlug(slug);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings = supabase.from("listings") as any;
  const { data, error } = await listings
    .select("name, slug, platforms, urls, website_url, description")
    .eq("status", "published")
    .eq("slug", canonicalSlug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getOwnListingById(userId: string, id: string): Promise<ListingRow | null> {
  const supabase = await getSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings = supabase.from("listings") as any;
  const { data, error } = await listings
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createListing(userId: string, input: ListingInput): Promise<ListingRow> {
  const supabase = await getSupabaseServerClient();
  const payload: ListingInsert = {
    user_id: userId,
    name: input.name,
    slug: input.slug,
    platforms: input.platforms,
    urls: input.urls,
    website_url: input.website_url,
    description: input.description,
    status: input.status,
    is_claimed: input.is_claimed,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings = supabase.from("listings") as any;
  const { data, error } = await listings.insert(payload).select("*").single();

  if (error) {
    logger.error("listing create failed", { userId, slug: input.slug, error: error.message });
    throw new Error(error.message);
  }

  return data;
}

export async function updateListing(
  userId: string,
  id: string,
  input: ListingInput,
): Promise<ListingRow | null> {
  const supabase = await getSupabaseServerClient();
  const payload: ListingUpdate = {
    name: input.name,
    slug: input.slug,
    platforms: input.platforms,
    urls: input.urls,
    website_url: input.website_url,
    description: input.description,
    status: input.status,
    is_claimed: input.is_claimed,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings = supabase.from("listings") as any;
  const { data, error } = await listings
    .update(payload)
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    logger.error("listing update failed", { userId, id, slug: input.slug, error: error.message });
    throw new Error(error.message);
  }

  return data;
}

export async function deleteListing(userId: string, id: string): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings = supabase.from("listings") as any;
  const { data, error } = await listings
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    logger.error("listing delete failed", { userId, id, error: error.message });
    throw new Error(error.message);
  }

  return Boolean(data);
}
