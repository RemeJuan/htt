// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseClientMock, createSupabaseQueryMock } from "./supabase-mock";

describe("lib/public-listings", () => {
  it("sanitizes malformed listings", async () => {
    const { sanitizePublicListings, sanitizePublicListing } = await import("@/lib/public-listings");

    expect(
      sanitizePublicListings([
        {
          name: "One",
          slug: "one",
          platforms: ["Web"],
          urls: { web: "https://one.test" },
          website_url: null,
          description: null,
        },
        {
          name: "",
          slug: "bad",
          platforms: ["Web"],
          urls: { web: "https://bad.test" },
          website_url: null,
          description: null,
        },
        null,
        {
          name: "Two",
          slug: "two",
          platforms: ["Web"],
          urls: { web: "https://two.test" },
          website_url: "https://two.example",
          description: null,
        },
        {
          name: "Bad urls",
          slug: "bad-urls",
          platforms: ["Web"],
          urls: null,
          website_url: null,
          description: null,
        },
        {
          name: "Bad website",
          slug: "bad-website",
          platforms: ["Web"],
          urls: { web: "https://valid.test" },
          website_url: "ftp://bad.example",
          description: null,
        },
      ]),
    ).toEqual([
      {
        name: "One",
        slug: "one",
        platforms: ["Web"],
        urls: { web: "https://one.test" },
        website_url: null,
        description: null,
      },
      {
        name: "Two",
        slug: "two",
        platforms: ["Web"],
        urls: { web: "https://two.test" },
        website_url: "https://two.example",
        description: null,
      },
    ]);

    expect(
      sanitizePublicListing({
        name: "X",
        slug: "x",
        platforms: ["Web"],
        urls: { web: "https://x.test" },
        website_url: "https://x.example",
        description: null,
      }),
    ).toEqual({
      name: "X",
      slug: "x",
      platforms: ["Web"],
      urls: { web: "https://x.test" },
      website_url: "https://x.example",
      description: null,
    });
    expect(sanitizePublicListings(null)).toEqual([]);
    expect(sanitizePublicListings({})).toEqual([]);
    expect(
      sanitizePublicListing({
        name: "X",
        slug: null,
        platforms: ["Web"],
        urls: { web: "https://x.test" },
        website_url: null,
        description: null,
      }),
    ).toBeNull();
  });

  it("queries only published rows with trimmed filters", async () => {
    vi.resetModules();
    const query = createSupabaseQueryMock({
      data: [
        {
          name: "One",
          slug: "one",
          platforms: ["Web"],
          urls: { web: "https://one.test" },
          website_url: null,
          description: null,
        },
        {
          name: "Broken",
          slug: 123,
          platforms: ["Web"],
          urls: { web: "https://bad.test" },
          website_url: null,
          description: null,
        },
      ],
      error: null,
    });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => client) }));
    vi.doMock("@/lib/env", () => ({
      env: { supabaseUrl: "https://supabase.test" },
      supabaseKey: "key",
    }));

    const { getPublishedListings } = await import("@/lib/public-listings");

    await expect(
      getPublishedListings({ search: " tracker ", platform: " ios ", limit: 4 }),
    ).resolves.toEqual([
      {
        name: "One",
        slug: "one",
        platforms: ["Web"],
        urls: { web: "https://one.test" },
        website_url: null,
        description: null,
      },
    ]);
    expect(query.chain.eq).toHaveBeenCalledWith("status", "published");
    expect(query.chain.ilike).toHaveBeenNthCalledWith(1, "name", "%tracker%");
    expect(query.chain.contains).toHaveBeenCalledWith("platforms", ["ios"]);
    expect(query.chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(query.chain.limit).toHaveBeenCalledWith(4);
  });

  it("defaults sort newest and fails closed on client or query problems", async () => {
    vi.resetModules();
    const query = createSupabaseQueryMock({ data: null, error: { message: "boom" } });
    const client = createSupabaseClientMock({ listings: query });
    const createClient = vi.fn(() => client);
    vi.doMock("@supabase/supabase-js", () => ({ createClient }));
    vi.doMock("@/lib/env", () => ({
      env: { supabaseUrl: "https://supabase.test" },
      supabaseKey: "key",
    }));

    const { getPublishedListings, getPublishedListingBySlug } =
      await import("@/lib/public-listings");

    await expect(getPublishedListings()).resolves.toEqual([]);
    expect(query.chain.order).toHaveBeenCalledWith("created_at", { ascending: false });

    vi.mocked(query.chain.eq).mockClear();
    query.chain.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    await expect(getPublishedListingBySlug(" SLUG ")).resolves.toBeNull();
    expect(query.chain.eq).toHaveBeenNthCalledWith(1, "status", "published");
    expect(query.chain.eq).toHaveBeenNthCalledWith(2, "slug", "slug");

    createClient.mockImplementationOnce(() => {
      throw new Error("client");
    });
    await expect(getPublishedListings()).resolves.toEqual([]);
  });

  it("returns empty list for null or non-array query payloads", async () => {
    vi.resetModules();
    const query = createSupabaseQueryMock({ data: { name: "not-an-array" }, error: null });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => client) }));
    vi.doMock("@/lib/env", () => ({
      env: { supabaseUrl: "https://supabase.test" },
      supabaseKey: "key",
    }));

    const { getPublishedListings } = await import("@/lib/public-listings");
    await expect(getPublishedListings()).resolves.toEqual([]);
  });

  it("returns null for malformed slug rows and missing env", async () => {
    vi.resetModules();
    const query = createSupabaseQueryMock({
      data: {
        name: "Broken",
        slug: null,
        platforms: ["Web"],
        urls: { web: "https://bad.test" },
        website_url: null,
        description: null,
      },
      error: null,
    });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => client) }));
    vi.doMock("@/lib/env", () => ({
      env: { supabaseUrl: "https://supabase.test" },
      supabaseKey: "key",
    }));

    const { getPublishedListingBySlug } = await import("@/lib/public-listings");
    await expect(getPublishedListingBySlug("broken")).resolves.toBeNull();

    query.chain.maybeSingle.mockResolvedValueOnce({
      data: {
        name: "One",
        slug: "one",
        platforms: ["Web"],
        urls: { web: "https://one.test" },
        website_url: "https://one.example",
        description: null,
      },
      error: null,
    });
    await expect(getPublishedListingBySlug(" ONE ")).resolves.toEqual({
      name: "One",
      slug: "one",
      platforms: ["Web"],
      urls: { web: "https://one.test" },
      website_url: "https://one.example",
      description: null,
    });

    query.chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(getPublishedListingBySlug("missing")).resolves.toBeNull();

    vi.resetModules();
    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
    vi.doMock("@/lib/env", () => ({ env: { supabaseUrl: "" }, supabaseKey: "" }));
    const lib = await import("@/lib/public-listings");
    await expect(lib.getPublishedListings()).resolves.toEqual([]);
    await expect(lib.getPublishedListingBySlug("slug")).resolves.toBeNull();
  });
});
