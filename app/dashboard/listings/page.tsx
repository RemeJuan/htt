import Link from "next/link";
import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";
import { requireAuthenticatedUser } from "@/lib/auth-user";
import { getOwnListings } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Dashboard listings",
  description: "Manage your owned listings.",
};

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const user = await requireAuthenticatedUser("/dashboard/listings");
  const listings = await getOwnListings(user.id).catch(() => []);

  return (
    <section className="space-y-8 py-6 sm:py-8 lg:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight">Listings</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Private listing management for {user.email ?? "your account"}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/listings/new"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
          >
            New listing
          </Link>
          <Link
            href="/listings"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            Browse public listings
          </Link>
        </div>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          eyebrow="Your dashboard is live."
          title="No listings yet"
          description="Create your first tracker listing. Drafts stay private until you publish them."
          primaryAction={
            <Link
              href="/dashboard/listings/new"
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
            >
              Create listing
            </Link>
          }
          secondaryAction={
            <Link href="/listings" className="text-sm font-medium underline underline-offset-4">
              Browse public listings
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {listings.map((listing) => (
            <article
              key={listing.id}
              className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{listing.name}</h2>
                <p className="text-sm text-muted-foreground">/{listing.slug}</p>
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <p>
                  <span className="text-foreground">Platforms:</span> {listing.platforms.join(", ")}
                </p>
                <p>
                  <span className="text-foreground">Status:</span> {listing.status}
                </p>
                <p>
                  <span className="text-foreground">Claimed:</span>{" "}
                  {listing.is_claimed ? "Yes" : "No"}
                </p>
                <p>
                  <span className="text-foreground">URLs:</span> {Object.keys(listing.urls).length}{" "}
                  platform(s)
                </p>
              </div>

              <p className="text-sm leading-6 text-foreground/80">
                {listing.description ?? "No description provided."}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
