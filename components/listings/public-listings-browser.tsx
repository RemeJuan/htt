"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { AddTrackerCta } from "@/components/listings/add-tracker-cta";
import { PublicListingsFeed } from "@/components/listings/public-listings-feed";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import type { PublicListingsPage } from "@/lib/public-listings";
import {
  PUBLIC_LISTINGS_QUERY_PARAM,
  buildPublicListingsSearchHref,
  normalizePublicListingsSearchQuery,
} from "@/lib/public-listings-search";

const DEFAULT_CACHE_KEY = "public-listings-cache:v1:all";

export function PublicListingsBrowser({
  initialPage,
  searchQuery,
}: {
  initialPage: PublicListingsPage;
  searchQuery: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [draftQuery, setDraftQuery] = useState(() => searchQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchQuery);
  const [isPending, startTransition] = useTransition();
  const cacheKey = useMemo(
    () =>
      searchQuery
        ? `public-listings-cache:v1:${encodeURIComponent(searchQuery)}`
        : DEFAULT_CACHE_KEY,
    [searchQuery],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(normalizePublicListingsSearchQuery(draftQuery));
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [draftQuery]);

  useEffect(() => {
    const currentQuery = normalizePublicListingsSearchQuery(
      searchParams.get(PUBLIC_LISTINGS_QUERY_PARAM),
    );

    if (debouncedQuery === currentQuery) {
      return;
    }

    const href = buildPublicListingsSearchHref(pathname, searchParams.toString(), debouncedQuery);

    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }, [debouncedQuery, pathname, router, searchParams]);

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-2xl border bg-card/60 p-4 shadow-sm">
        <label htmlFor="public-listings-search" className="text-sm font-medium text-foreground">
          Search listings
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="public-listings-search"
            name="q"
            type="search"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Search trackers, blurbs, or URLs"
            autoComplete="off"
            className="min-h-11 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
          />
          {draftQuery ? (
            <button
              type="button"
              onClick={() => setDraftQuery("")}
              className="min-h-11 rounded-xl border px-4 py-3 text-sm font-medium transition hover:bg-muted"
            >
              Clear
            </button>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Search name, description, slug, and linked site URL.
        </p>
      </div>

      {isPending ? (
        <LoadingState
          title="Searching listings"
          description="Scanning trackers, blurbs, and links."
        />
      ) : null}

      {initialPage.items.length === 0 ? (
        searchQuery ? (
          <EmptyState
            eyebrow="Search goblin found nothing."
            title={`No listings found for “${searchQuery}”`}
            description="Try habit, streak, a tracker name, or clear search and doomscroll whole feed."
            primaryAction={
              <button
                type="button"
                onClick={() => setDraftQuery("")}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Clear search
              </button>
            }
          />
        ) : (
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
        )
      ) : (
        <PublicListingsFeed
          initialPage={initialPage}
          searchQuery={searchQuery}
          cacheKey={cacheKey}
        />
      )}
    </div>
  );
}
