import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublishedListingBySlug, getPublishedListings } from "@/lib/public-listings";

export async function generateStaticParams() {
  const listings = await getPublishedListings();

  const params = listings.map((listing) => ({ slug: listing.slug }));

  return params.length > 0 ? params : [{ slug: "placeholder" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getPublishedListingBySlug(slug);

  if (!listing) {
    return { title: "Listing not found" };
  }

  return {
    title: listing.name,
    description: listing.description ?? `${listing.name} on ${listing.platform}.`,
    openGraph: {
      title: listing.name,
      description: listing.description ?? `${listing.name} on ${listing.platform}.`,
      type: "article",
    },
  };
}

export default async function PublicListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getPublishedListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  return (
    <section className="space-y-6 py-10 md:py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Public listing</p>
        <h1 className="text-3xl font-semibold tracking-tight">{listing.name}</h1>
      </div>

      <article className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Slug</p>
            <p className="font-medium">{listing.slug}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Platform</p>
            <p className="font-medium">{listing.platform}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium">Published</p>
          </div>
          <div>
            <p className="text-muted-foreground">Outbound URL</p>
            <a href={listing.url} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
              {listing.url}
            </a>
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
