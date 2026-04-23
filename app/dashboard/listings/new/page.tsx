import Link from "next/link";
import type { Metadata } from "next";

import { ListingForm } from "@/components/listings/listing-form";

import { createListingAction } from "@/app/dashboard/listings/actions";
import { requireAuthenticatedUser } from "@/lib/auth-user";

export const metadata: Metadata = {
  title: "New listing",
  description: "Create a new listing in your dashboard.",
};

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  await requireAuthenticatedUser("/dashboard/listings/new");

  return (
    <section className="space-y-6 py-6 sm:py-8 lg:py-10">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight">New listing</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Create a tracker listing backed by the runtime app. Save drafts now. Publish when ready.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Create a listing for a habit tracker (yours or one you found). You can publish later.
        </p>
      </div>

      <ListingForm action={createListingAction} submitLabel="Create listing" />

      <Link
        href="/dashboard/listings"
        className="inline-flex text-sm font-medium underline underline-offset-4"
      >
        Back to listings
      </Link>
    </section>
  );
}
