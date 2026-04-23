// @vitest-environment node

import { describe, expect, it, vi, beforeEach } from "vitest";

import { createSupabaseClientMock, createSupabaseQueryMock } from "./supabase-mock";

const sampleListing = {
  name: "One",
  slug: "one",
  platforms: ["Web"],
  urls: { web: "https://one.test" },
  website_url: null,
  description: null,
  created_at: "2025-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("lib/public-listings-shared", () => {
  it("merges pages and drops duplicate slugs", async () => {
    const { mergePublicListingsPages } = await import("@/lib/public-listings-shared");

    expect(
      mergePublicListingsPages(
        { items: [sampleListing], hasMore: true, nextCursor: "a" },
        {
          items: [
            sampleListing,
            {
              ...sampleListing,
              slug: "two",
              name: "Two",
            },
          ],
          hasMore: false,
          nextCursor: null,
        },
      ),
    ).toEqual({
      items: [sampleListing, { ...sampleListing, slug: "two", name: "Two" }],
      hasMore: false,
      nextCursor: null,
    });
  });

  it("reads, writes, and resolves cached pages with sessionStorage", async () => {
    const storage = (() => {
      const map = new Map<string, string>();
      return {
        getItem: vi.fn((key: string) => map.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => map.set(key, value)),
        removeItem: vi.fn((key: string) => map.delete(key)),
      } as unknown as Storage;
    })();

    const shared = await import("@/lib/public-listings-shared");

    const page = { items: [sampleListing], hasMore: false, nextCursor: null };
    expect(shared.writePublicListingsPageCache(page, storage)).toEqual(page);
    expect(shared.readPublicListingsPageCache(storage)).toEqual(page);

    const resolved = shared.resolvePublicListingsPageState(
      {
        items: [sampleListing],
        hasMore: true,
        nextCursor: "first",
      },
      storage,
    );

    expect(resolved).toEqual({
      items: [sampleListing],
      hasMore: false,
      nextCursor: null,
    });
  });

  it("drops cached tail when fresh first page no longer matches", async () => {
    const storage = (() => {
      const map = new Map<string, string>();
      return {
        getItem: vi.fn((key: string) => map.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => map.set(key, value)),
        removeItem: vi.fn((key: string) => map.delete(key)),
      } as unknown as Storage;
    })();

    const shared = await import("@/lib/public-listings-shared");

    shared.writePublicListingsPageCache(
      {
        items: [sampleListing, { ...sampleListing, slug: "two", name: "Two" }],
        hasMore: true,
        nextCursor: "cursor-two",
      },
      storage,
    );

    expect(
      shared.resolvePublicListingsPageState(
        {
          items: [{ ...sampleListing, slug: "fresh", name: "Fresh" }],
          hasMore: true,
          nextCursor: "cursor-fresh",
        },
        storage,
      ),
    ).toEqual({
      items: [{ ...sampleListing, slug: "fresh", name: "Fresh" }],
      hasMore: true,
      nextCursor: "cursor-fresh",
    });
  });

  it("rejects malformed cache payloads", async () => {
    const storage = {
      getItem: vi.fn(() => JSON.stringify({ items: [{ slug: "x" }], hasMore: true, nextCursor: null })),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    } as unknown as Storage;

    const { readPublicListingsPageCache } = await import("@/lib/public-listings-shared");
    expect(readPublicListingsPageCache(storage)).toBeNull();
    expect(storage.removeItem).toHaveBeenCalled();
  });
});

describe("lib/public-listings", () => {
  it("queries paginated published rows with cursor and limit", async () => {
    const query = createSupabaseQueryMock({
      data: [sampleListing, { ...sampleListing, slug: "two", created_at: "2025-01-02T00:00:00.000Z", name: "Two" }],
      error: null,
    });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => client) }));
    vi.doMock("@/lib/env", () => ({
      env: { supabaseUrl: "https://supabase.test" },
      supabaseKey: "key",
    }));

    const { getPublishedListingsPage, PUBLIC_LISTINGS_PAGE_SIZE } = await import("@/lib/public-listings");

    const result = await getPublishedListingsPage({ limit: 1 });

    expect(result.items).toEqual([sampleListing]);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBeTruthy();
    expect(query.chain.limit).toHaveBeenCalledWith(2);
    expect(query.chain.or).not.toHaveBeenCalled();

    await getPublishedListingsPage({ sort: "oldest", cursor: result.nextCursor });
    expect(query.chain.order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(query.chain.or).toHaveBeenCalled();
    expect(PUBLIC_LISTINGS_PAGE_SIZE).toBe(20);
  });

  it("rejects invalid cursors", async () => {
    const query = createSupabaseQueryMock({
      data: [sampleListing],
      error: null,
    });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => client) }));
    vi.doMock("@/lib/env", () => ({
      env: { supabaseUrl: "https://supabase.test" },
      supabaseKey: "key",
    }));

    const { getPublishedListingsPage } = await import("@/lib/public-listings");

    await expect(getPublishedListingsPage({ cursor: "bad" })).rejects.toThrow(
      "Invalid public listings cursor.",
    );
    expect(query.chain.or).not.toHaveBeenCalled();
  });

  it("throws page errors, keeps legacy list helper fail-closed, and keeps slug lookup null-safe", async () => {
    const query = createSupabaseQueryMock({ data: null, error: { message: "boom" } });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => client) }));
    vi.doMock("@/lib/env", () => ({
      env: { supabaseUrl: "https://supabase.test" },
      supabaseKey: "key",
    }));

    const { getPublishedListings, getPublishedListingsPage, getPublishedListingBySlug } = await import(
      "@/lib/public-listings"
    );

    await expect(getPublishedListingsPage()).rejects.toThrow("Failed to fetch published listings.");
    await expect(getPublishedListings()).resolves.toEqual([]);
    await expect(getPublishedListingBySlug(" slug ")).resolves.toBeNull();
  });
});
