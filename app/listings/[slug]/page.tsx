import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublishedListingBySlug, sanitizePublicListing } from "@/lib/public-listings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = sanitizePublicListing(await getPublishedListingBySlug(slug).catch(() => null));

  if (!listing) {
    return { title: "Listing not found" };
  }

  const primaryPlatform = listing.platforms[0] ?? "Unknown";

  return {
    title: listing.name,
    description: listing.description ?? `${listing.name} on ${primaryPlatform}.`,
    openGraph: {
      title: listing.name,
      description: listing.description ?? `${listing.name} on ${primaryPlatform}.`,
      type: "article",
    },
  };
}

export default async function PublicListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = sanitizePublicListing(await getPublishedListingBySlug(slug).catch(() => null));

  if (!listing) {
    notFound();
  }

  return (
    <section className="space-y-6 py-6 sm:py-8 lg:py-10">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Public listing</p>
        <h1 className="text-3xl font-semibold tracking-tight">{listing.name}</h1>
      </div>

      <article className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Slug</p>
            <p className="font-medium">{listing.slug}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Platforms</p>
            <p className="font-medium">{listing.platforms.join(", ")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium">Published</p>
          </div>
          {listing.website_url ? (
            <div>
              <p className="text-muted-foreground">Website</p>
              <a
                href={listing.website_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4"
              >
                {listing.website_url}
              </a>
            </div>
          ) : null}
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Platform URLs</p>
            <ul className="mt-2 space-y-1">
              {Object.entries(listing.urls).map(([platform, url]) => (
                <li key={platform}>
                  <span className="capitalize text-muted-foreground">{platform}: </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Description</p>
          <p className="whitespace-pre-line leading-7 text-foreground/90">
            {listing.description ?? "No description provided."}
          </p>
        </div>

        <div>
          <Link href="/listings" className="text-sm font-medium underline underline-offset-4">
            Back to listings
          </Link>
        </div>
      </article>
    </section>
  );
}
