import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { getPublishedListings } from "@/lib/listings";

type ListingsSearchParams = {
  q?: string;
  platform?: string;
  sort?: string;
};

export const metadata: Metadata = {
  title: "Listings",
};

export default async function PublicListingsPage({
  searchParams,
}: {
  searchParams: Promise<ListingsSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.q?.trim() ?? "";
  const platform = resolvedSearchParams.platform?.trim() ?? "";
  const sort = resolvedSearchParams.sort === "oldest" ? "oldest" : "newest";

  const listings = await getPublishedListings({
    search,
    platform,
    sort,
  });

  const hasFilters = Boolean(search || platform || sort !== "newest");

  return (
    <section className="space-y-8 py-10 md:py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Public</p>
        <h1 className="text-3xl font-semibold tracking-tight">Listings</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Published listings only.
        </p>
      </div>

      <form className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-3" method="get">
        <label className="space-y-2 text-sm">
          <span className="font-medium">Search</span>
          <input
            name="q"
            defaultValue={search}
            placeholder="Name"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Platform</span>
          <input
            name="platform"
            defaultValue={platform}
            placeholder="Platform"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Sort</span>
          <select
            name="sort"
            defaultValue={sort}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-0"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
        <div className="md:col-span-3 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background"
          >
            Apply
          </button>
          {hasFilters ? (
            <Link href="/listings" className="text-sm font-medium underline underline-offset-4">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {listings.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching listings" : "No published listings yet"}
          description={
            hasFilters
              ? "Try a different search or clear the filters."
              : "Published listings will appear here once they are available."
          }
          action={
            hasFilters ? (
              <Link href="/listings" className="text-sm font-medium underline underline-offset-4">
                View all listings
              </Link>
            ) : null
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

              <div className="flex items-center gap-3">
                <Link
                  href={`/listings/${listing.slug}`}
                  className="inline-flex h-10 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background"
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
