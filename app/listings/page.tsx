import type { Metadata } from "next";
import Link from "next/link";

import { AddTrackerCta } from "@/components/listings/add-tracker-cta";
import { PublicListingCard } from "@/components/listings/public-listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublishedListings, sanitizePublicListings } from "@/lib/public-listings";

export const metadata: Metadata = {
  title: "Listings",
  description: "Browse published listings.",
};

export default async function PublicListingsPage() {
  const listings = sanitizePublicListings(await getPublishedListings().catch(() => []));

  return (
    <section className="space-y-8 py-6 sm:py-8 lg:py-10">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Public</p>
        <h1 className="text-3xl font-semibold tracking-tight">Listings</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Published listings only.
        </p>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          eyebrow="Track the trackers you’ve built or found. Not habits."
          title="No trackers yet"
          description="Be the first to add a habit tracker to the tracker."
          primaryAction={<AddTrackerCta />}
          secondaryAction={
            <Link href="/" className="text-sm font-medium underline underline-offset-4">
              Back home
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {listings.map((listing) => (
            <PublicListingCard key={listing.slug} listing={listing} compact />
          ))}
        </div>
      )}
    </section>
  );
}
