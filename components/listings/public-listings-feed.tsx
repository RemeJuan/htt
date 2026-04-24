"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { PublicListingCard } from "@/components/listings/public-listing-card";
import { LoadingState } from "@/components/ui/loading-state";
import {
  mergePublicListingsPages,
  resolvePublicListingsPageState,
  sanitizePublicListingsPage,
  writePublicListingsPageCache,
  type PublicListingsPage,
} from "@/lib/public-listings-shared";

export function PublicListingsFeed({
  initialPage,
  searchQuery = "",
  cacheKey,
}: {
  initialPage: PublicListingsPage;
  searchQuery?: string;
  cacheKey?: string;
}) {
  const [page, setPage] = useState(initialPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isLoadingMoreRef = useRef(false);
  const hasMoreRef = useRef(initialPage.hasMore);
  const nextCursorRef = useRef(initialPage.nextCursor);

  useEffect(() => {
    const resolvedPage = resolvePublicListingsPageState(initialPage, undefined, cacheKey);
    const frame = window.requestAnimationFrame(() => {
      setPage((currentPage) => (currentPage === resolvedPage ? currentPage : resolvedPage));
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [cacheKey, initialPage]);

  useEffect(() => {
    hasMoreRef.current = page.hasMore;
    nextCursorRef.current = page.nextCursor;
    writePublicListingsPageCache(page, undefined, cacheKey);
  }, [cacheKey, page]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMoreRef.current || !nextCursorRef.current) {
      return;
    }

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams();
      params.set("cursor", nextCursorRef.current);

      if (searchQuery) {
        params.set("q", searchQuery);
      }

      const response = await fetch(`/api/public-listings?${params.toString()}`, {
        method: "GET",
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to load more listings.");
      }

      const nextPage = sanitizePublicListingsPage(await response.json());

      if (!nextPage) {
        throw new Error("Received malformed listings payload.");
      }

      setPage((currentPage) => mergePublicListingsPages(currentPage, nextPage));
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      setLoadError(error instanceof Error ? error.message : "Failed to load more listings.");
    } finally {
      if (abortRef.current === abortController) {
        abortRef.current = null;
      }

      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (
      !sentinel ||
      !page.hasMore ||
      !page.nextCursor ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, page.hasMore, page.nextCursor]);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        {page.items.map((listing) => (
          <PublicListingCard key={listing.slug} listing={listing} compact />
        ))}
      </div>

      {isLoadingMore ? (
        <LoadingState
          title="Loading more listings"
          description="Fetching more published listings."
        />
      ) : null}

      {loadError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => void loadMore()}
            className="mt-3 font-medium underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      ) : null}

      {page.hasMore && page.nextCursor ? (
        <div
          ref={sentinelRef}
          aria-hidden="true"
          data-testid="public-listings-sentinel"
          className="h-px w-full"
        />
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          You’ve reached the end of the listings.
        </p>
      )}
    </div>
  );
}
