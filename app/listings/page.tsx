import type { Metadata } from "next";

import { PublicListingsBrowser } from "@/components/listings/public-listings-browser";
import { ErrorState } from "@/components/ui/error-state";
import { PUBLIC_LISTINGS_PAGE_SIZE, getPublishedListingsPage } from "@/lib/public-listings";
import { readPublicListingsSearchParams } from "@/lib/public-listings-search";

export const metadata: Metadata = {
  title: "Listings",
  description: "Browse published listings.",
};

export default async function PublicListingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  let initialPage = null;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { query } = readPublicListingsSearchParams(resolvedSearchParams);

  try {
    initialPage = await getPublishedListingsPage({
      limit: PUBLIC_LISTINGS_PAGE_SIZE,
      search: query,
    });
  } catch {
    initialPage = null;
  }

  return (
    <section className="space-y-8 py-6 sm:py-8 lg:py-10">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Public</p>
        <h1 className="text-3xl font-semibold tracking-tight">Listings</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Published listings only.
        </p>
      </div>

      {!initialPage ? (
        <ErrorState title="Couldn’t load listings" description="Refresh the page and try again." />
      ) : (
        <PublicListingsBrowser initialPage={initialPage} searchQuery={query} />
      )}
    </section>
  );
}
