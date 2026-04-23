import type { Metadata } from "next";
import Link from "next/link";

import { AddTrackerCta } from "@/components/listings/add-tracker-cta";
import { PublicListingsFeed } from "@/components/listings/public-listings-feed";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PUBLIC_LISTINGS_PAGE_SIZE, getPublishedListingsPage } from "@/lib/public-listings";

export const metadata: Metadata = {
  title: "Listings",
  description: "Browse published listings.",
};

export default async function PublicListingsPage() {
  let initialPage = null;

  try {
    initialPage = await getPublishedListingsPage({ limit: PUBLIC_LISTINGS_PAGE_SIZE });
  } catch {
    initialPage = null;
  }

  return (
    <section className="space-y-8 py-6 sm:py-8 lg:py-10">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Public</p>
        <h1 className="text-3xl font-semibold tracking-tight">Listings</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Published listings only.</p>
      </div>

      {!initialPage ? (
        <ErrorState title="Couldn’t load listings" description="Refresh the page and try again." />
      ) : initialPage.items.length === 0 ? (
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
        <PublicListingsFeed initialPage={initialPage} />
      )}
    </section>
  );
}
