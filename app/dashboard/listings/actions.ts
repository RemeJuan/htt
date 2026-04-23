"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser } from "@/lib/auth-user";
import { createListing } from "@/lib/listings";
import {
  isValidListingSlug,
  listingStatusValues,
  platformOptions,
  validatePlatformUrls,
  validateWebsiteUrl,
} from "@/lib/listing-validation";
import type { ListingStatus } from "@/lib/database.types";

type ListingActionState = {
  errors: Partial<
    Record<"name" | "slug" | "platforms" | "website_url" | "description" | "status", string> &
      Record<string, string>
  >;
  message?: string;
};

function getStringValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function getPlatforms(formData: FormData): string[] {
  const platforms = formData.getAll("platforms");
  return platforms.map((p) => String(p)).filter((p) => p.length > 0);
}

function getUrls(formData: FormData): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const platform of platformOptions) {
    const url = getStringValue(formData, `url_${platform.toLowerCase()}`);
    if (url) {
      urls[platform.toLowerCase()] = url;
    }
  }
  return urls;
}

function validateListing(
  formData: FormData,
):
  | { input: Parameters<typeof createListing>[1]; errors: ListingActionState["errors"] }
  | { input: null; errors: ListingActionState["errors"] } {
  const name = getStringValue(formData, "name");
  const slug = getStringValue(formData, "slug").toLowerCase();
  const platforms = getPlatforms(formData);
  const urls = getUrls(formData);
  const website_url = getStringValue(formData, "website_url");
  const description = getStringValue(formData, "description");
  const status = getStringValue(formData, "status");
  const is_claimed = formData.get("is_claimed") !== null;

  const errors: ListingActionState["errors"] = {};

  if (!name) {
    errors.name = "Name is required.";
  }

  if (!slug) {
    errors.slug = "Slug is required.";
  } else if (!isValidListingSlug(slug)) {
    errors.slug = "Use lowercase letters, numbers, and hyphens only.";
  }

  const platformUrlValidation = validatePlatformUrls(platforms, urls);
  if (!platformUrlValidation.valid) {
    Object.assign(errors, platformUrlValidation.errors);
  }

  const websiteUrlValidation = validateWebsiteUrl(website_url);
  if (!websiteUrlValidation.valid) {
    errors.website_url = websiteUrlValidation.error ?? "Invalid website URL.";
  }

  const statusNormalized = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  if (!listingStatusValues.includes(statusNormalized as (typeof listingStatusValues)[number])) {
    errors.status = "Choose Draft or Published.";
  }

  if (Object.keys(errors).length > 0) {
    return { input: null, errors };
  }

  return {
    input: {
      name,
      slug,
      platforms,
      urls,
      website_url: website_url || null,
      description: description || null,
      status: statusNormalized.toLowerCase() as ListingStatus,
      is_claimed,
    },
    errors: {},
  };
}

export async function createListingAction(
  _state: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const user = await requireAuthenticatedUser("/dashboard/listings/new");
  const { input, errors } = validateListing(formData);

  if (!input) {
    return {
      errors,
      message: "Fix the highlighted fields.",
    };
  }

  try {
    await createListing(user.id, input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save listing.";

    if (/duplicate key|unique constraint|slug/i.test(message)) {
      return {
        errors: {
          slug: "Slug already taken.",
        },
        message: "Fix the highlighted fields.",
      };
    }

    return {
      errors: {},
      message,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/listings");
  revalidatePath("/listings");
  revalidatePath(`/listings/${input.slug}`);

  return {
    errors: {},
    message: "Listing created.",
  };
}
