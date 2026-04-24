import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { env, supabaseKey } from "@/lib/env";
import { isValidListingSlug } from "@/lib/listing-validation";
import { normalizePublicListingsSearchQuery } from "@/lib/public-listings-search";
import {
  sanitizePublicListing,
  sanitizePublicListings,
  type PublicListing,
  type PublicListingsPage,
} from "@/lib/public-listings-shared";

export { sanitizePublicListing, sanitizePublicListings };
export type { PublicListing, PublicListingsPage };

type PublicListingRow = PublicListing &
  Pick<Database["public"]["Tables"]["listings"]["Row"], "created_at">;

export const PUBLIC_LISTINGS_PAGE_SIZE = 20;

const PUBLIC_LISTING_SELECT = "name, slug, platforms, urls, website_url, description, created_at";

function escapeIlikeValue(value: string) {
  return value.replace(/[%_]/g, (character) => `\\${character}`);
}

function isPublicListingRow(value: unknown): value is PublicListingRow {
  return (
    !!sanitizePublicListing(value) &&
    typeof (value as { created_at?: unknown }).created_at === "string" &&
    (value as { created_at: string }).created_at.length > 0
  );
}

function encodePublicListingsCursor({
  created_at,
  slug,
}: Pick<Database["public"]["Tables"]["listings"]["Row"], "created_at" | "slug">) {
  return Buffer.from(JSON.stringify({ created_at, slug }), "utf8").toString("base64url");
}

function decodePublicListingsCursor(cursor: string) {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      created_at?: unknown;
      slug?: unknown;
    };

    if (
      typeof parsed.created_at !== "string" ||
      Number.isNaN(Date.parse(parsed.created_at)) ||
      typeof parsed.slug !== "string" ||
      !isValidListingSlug(parsed.slug)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
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
  limit?: number;
}): Promise<PublicListing[]> {
  try {
    const page = await getPublishedListingsPage(params);

    return page.items;
  } catch {
    return [];
  }
}

export async function getPublishedListingsPage(params?: {
  search?: string;
  platform?: string;
  sort?: "newest" | "oldest";
  limit?: number;
  cursor?: string | null;
}): Promise<PublicListingsPage> {
  try {
    const supabase = createPublicClient();
    const search = normalizePublicListingsSearchQuery(params?.search);
    const platform = params?.platform?.trim();
    const sort = params?.sort === "oldest" ? "oldest" : "newest";
    const limit =
      typeof params?.limit === "number" && params.limit > 0
        ? params.limit
        : PUBLIC_LISTINGS_PAGE_SIZE;
    const rawCursor = params?.cursor?.trim() ?? null;
    const cursor = rawCursor ? decodePublicListingsCursor(rawCursor) : null;
    const ascending = sort === "oldest";

    if (rawCursor && !cursor) {
      throw new Error("Invalid public listings cursor.");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = supabase.from("listings") as any;
    query = query
      .select(PUBLIC_LISTING_SELECT)
      .eq("status", "published")
      .order("created_at", { ascending })
      .order("slug", { ascending });

    if (search) {
      const escapedSearch = escapeIlikeValue(search);
      query = query.or(
        [
          `name.ilike.%${escapedSearch}%`,
          `slug.ilike.%${escapedSearch}%`,
          `description.ilike.%${escapedSearch}%`,
          `website_url.ilike.%${escapedSearch}%`,
        ].join(","),
      );
    }

    if (platform) {
      query = query.contains("platforms", [platform]);
    }

    if (cursor) {
      const comparator = ascending ? "gt" : "lt";
      query = query.or(
        `created_at.${comparator}.${cursor.created_at},and(created_at.eq.${cursor.created_at},slug.${comparator}.${cursor.slug})`,
      );
    }

    query = query.limit(limit + 1);

    const { data, error } = await query;

    if (error) {
      throw new Error("Failed to fetch published listings.");
    }

    const listings = Array.isArray(data) ? data.filter(isPublicListingRow) : [];
    const pageItems = listings.slice(0, limit);
    const lastItem = pageItems.at(-1) ?? null;

    return {
      items: sanitizePublicListings(pageItems),
      hasMore: listings.length > limit,
      nextCursor: listings.length > limit && lastItem ? encodePublicListingsCursor(lastItem) : null,
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to fetch published listings.");
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
