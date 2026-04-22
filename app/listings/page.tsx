import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { getPublishedListings } from "@/lib/public-listings";

export const metadata: Metadata = {
  title: "Listings",
  description: "Browse published listings.",
};

export default async function PublicListingsPage() {
  const listings = await getPublishedListings();

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
          title="No published listings yet"
          description="Published listings will appear here once they are available."
          action={
            <Link href="/" className="text-sm font-medium underline underline-offset-4">
              Back home
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {listings.map((listing) => (
            <article key={listing.slug} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{listing.name}</h2>
                <p className="text-sm text-muted-foreground">/{listing.slug}</p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="text-foreground">Platform:</span> {listing.platform}
                </p>
                <p className="leading-6 text-foreground/80">
                  {listing.description ?? "No description provided."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={`/listings/${listing.slug}`}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
                >
                  View details
                </Link>
                <a href={listing.url} target="_blank" rel="noreferrer" className="text-sm font-medium underline underline-offset-4">
                  Visit site
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
