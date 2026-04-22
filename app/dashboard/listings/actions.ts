import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ListingStatus } from "@/lib/database.types";
import { getOwnListingById, createListing, updateListing, deleteListing } from "@/lib/listings";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  isValidListingSlug,
  isValidListingUrl,
  listingStatusValues,
} from "@/lib/listing-validation";

type ListingFieldErrors = Partial<Record<"name" | "slug" | "platform" | "url" | "description" | "status", string>>;

export type ListingActionState = {
  errors: ListingFieldErrors;
  message?: string;
};

const initialState: ListingActionState = { errors: {} };

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validateListingForm(formData: FormData) {
  const name = getFormValue(formData, "name");
  const slug = getFormValue(formData, "slug");
  const platform = getFormValue(formData, "platform");
  const url = getFormValue(formData, "url");
  const description = getFormValue(formData, "description");
  const status = getFormValue(formData, "status");
  const isClaimed = formData.get("is_claimed") === "on";

  const errors: ListingFieldErrors = {};

  if (!name) errors.name = "Name is required.";
  if (!slug) errors.slug = "Slug is required.";
  else if (!isValidListingSlug(slug)) errors.slug = "Use lowercase letters, numbers, and hyphens.";
  if (!platform) errors.platform = "Platform is required.";
  if (!url) errors.url = "URL is required.";
  else if (!isValidListingUrl(url)) errors.url = "Use a valid http or https URL.";
  if (!status) errors.status = "Status is required.";
  else if (!listingStatusValues.includes(status as ListingStatus)) errors.status = "Pick a valid status.";

  return {
    errors,
    input: {
      name,
      slug,
      platform,
      url,
      description: description || null,
      status: status as ListingStatus,
      is_claimed: isClaimed,
    },
  };
}

async function getAuthedUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function createListingAction(
  _prevState: ListingActionState = initialState,
  formData: FormData,
): Promise<ListingActionState> {
  "use server";

  void _prevState;

  const user = await getAuthedUser();
  if (!user) {
    redirect("/login");
  }

  const { errors, input } = validateListingForm(formData);
  if (Object.keys(errors).length > 0) {
    return { errors, message: "Fix the highlighted fields." };
  }

  const listing = await createListing(user.id, input);
  revalidatePath("/dashboard/listings");
  revalidatePath("/listings");
  revalidatePath(`/listings/${listing.slug}`);
  redirect("/dashboard/listings");
}

export async function updateListingAction(
  id: string,
  _prevState: ListingActionState = initialState,
  formData: FormData,
): Promise<ListingActionState> {
  "use server";

  void _prevState;

  const user = await getAuthedUser();
  if (!user) {
    redirect("/login");
  }

  const existing = await getOwnListingById(user.id, id);
  if (!existing) {
    return { errors: {}, message: "Listing not found." };
  }

  const { errors, input } = validateListingForm(formData);
  if (Object.keys(errors).length > 0) {
    return { errors, message: "Fix the highlighted fields." };
  }

  await updateListing(user.id, id, input);
  revalidatePath("/dashboard/listings");
  revalidatePath("/listings");
  revalidatePath(`/listings/${existing.slug}`);
  revalidatePath(`/listings/${input.slug}`);
  redirect("/dashboard/listings");
}

export async function deleteListingAction(id: string) {
  "use server";

  const user = await getAuthedUser();
  if (!user) {
    redirect("/login");
  }

  const existing = await getOwnListingById(user.id, id);
  if (!existing) {
    redirect("/dashboard/listings");
  }

  await deleteListing(user.id, id);
  revalidatePath("/dashboard/listings");
  revalidatePath("/listings");
  revalidatePath(`/listings/${existing.slug}`);
  redirect("/dashboard/listings");
}
