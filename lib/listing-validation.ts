import type { ListingStatus } from "@/lib/database.types";

export const listingStatusValues = [
  "draft",
  "published",
] as const satisfies readonly ListingStatus[];

export const listingSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidListingSlug(slug: string) {
  return listingSlugPattern.test(slug);
}

export function isValidListingUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const listingFieldRequirements = {
  name: "required",
  slug: "required, unique",
  platform: "required, free text",
  url: "required, valid url",
  description: "optional",
  status: "draft | published",
  is_claimed: "defaults true",
} as const;
