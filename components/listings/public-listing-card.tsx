import Link from "next/link";

import { getCardExcerpt } from "@/lib/card-excerpt";
import type { PublicListing } from "@/lib/public-listings";

function getExternalUrl(listing: PublicListing) {
  return listing.website_url ?? Object.values(listing.urls)[0] ?? null;
}

export function PublicListingCard({
  listing,
  compact = false,
  showExternalUrl = false,
}: {
  listing: PublicListing;
  compact?: boolean;
  showExternalUrl?: boolean;
}) {
  const externalUrl = getExternalUrl(listing);
  const excerpt = listing.description ? getCardExcerpt(listing.description) : "";

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm ${
        compact ? "p-4 sm:p-5" : "p-5 sm:p-6"
      }`}
    >
      <div className={`flex h-full flex-col ${compact ? "gap-4" : "gap-5"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h3 className={compact ? "text-lg font-semibold tracking-tight" : "text-xl font-semibold tracking-tight"}>
              <Link href={`/listings/${listing.slug}`} className="transition hover:opacity-80">
                {listing.name}
              </Link>
            </h3>

            <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
              {listing.platforms.map((platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-border bg-background px-2.5 py-1"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>

          <Link
            href={`/listings/${listing.slug}`}
            aria-label={`View details for ${listing.name}`}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-border px-4 text-sm font-medium transition hover:bg-accent"
          >
            View details
          </Link>
        </div>

        <p className="min-h-[3.5rem] line-clamp-2 leading-7 text-muted-foreground">{excerpt}</p>

        {showExternalUrl && externalUrl ? (
          <div className="mt-auto">
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium underline underline-offset-4"
            >
              Visit site
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}
