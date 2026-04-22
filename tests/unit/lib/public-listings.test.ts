// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseClientMock, createSupabaseQueryMock } from "./supabase-mock";

describe("lib/public-listings", () => {
  it("sanitizes malformed listings", async () => {
    const { sanitizePublicListings, sanitizePublicListing } = await import("@/lib/public-listings");

    expect(
      sanitizePublicListings([
        { name: "One", slug: "one", platform: "Web", description: null, url: "https://one.test" },
        { name: "", slug: "bad", platform: "Web", description: null, url: "https://bad.test" },
        null,
        { name: "Two", slug: "two", platform: "Web", url: "https://two.test" },
      ]),
    ).toEqual([
      { name: "One", slug: "one", platform: "Web", description: null, url: "https://one.test" },
    ]);

    expect(sanitizePublicListing({ name: "X", slug: "x", platform: "Web", description: null, url: "https://x.test" })).toEqual({
      name: "X",
      slug: "x",
      platform: "Web",
      description: null,
      url: "https://x.test",
    });
    expect(sanitizePublicListings(null)).toEqual([]);
    expect(sanitizePublicListings({})).toEqual([]);
    expect(sanitizePublicListing({ name: "X", slug: null, platform: "Web", description: null, url: "https://x.test" })).toBeNull();
  });

  it("queries only published rows with trimmed filters", async () => {
    vi.resetModules();
    const query = createSupabaseQueryMock({
      data: [
        { name: "One", slug: "one", platform: "Web", description: null, url: "https://one.test" },
        { name: "Broken", slug: 123, platform: "Web", description: null, url: "https://bad.test" },
      ],
      error: null,
    });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => client) }));
    vi.doMock("@/lib/env", () => ({ env: { supabaseUrl: "https://supabase.test" }, supabaseKey: "key" }));

    const { getPublishedListings } = await import("@/lib/public-listings");

    await expect(getPublishedListings({ search: " tracker ", platform: " ios " })).resolves.toEqual([
      { name: "One", slug: "one", platform: "Web", description: null, url: "https://one.test" },
    ]);
    expect(query.chain.eq).toHaveBeenCalledWith("status", "published");
    expect(query.chain.ilike).toHaveBeenNthCalledWith(1, "name", "%tracker%");
    expect(query.chain.ilike).toHaveBeenNthCalledWith(2, "platform", "%ios%");
    expect(query.chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("defaults sort newest and fails closed on client or query problems", async () => {
    vi.resetModules();
    const query = createSupabaseQueryMock({ data: null, error: { message: "boom" } });
    const client = createSupabaseClientMock({ listings: query });
    const createClient = vi.fn(() => client);
    vi.doMock("@supabase/supabase-js", () => ({ createClient }));
    vi.doMock("@/lib/env", () => ({ env: { supabaseUrl: "https://supabase.test" }, supabaseKey: "key" }));

    const { getPublishedListings, getPublishedListingBySlug } = await import("@/lib/public-listings");

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
    vi.doMock("@/lib/env", () => ({ env: { supabaseUrl: "https://supabase.test" }, supabaseKey: "key" }));

    const { getPublishedListings } = await import("@/lib/public-listings");
    await expect(getPublishedListings()).resolves.toEqual([]);
  });

  it("returns null for malformed slug rows and missing env", async () => {
    vi.resetModules();
    const query = createSupabaseQueryMock({
      data: { name: "Broken", slug: null, platform: "Web", description: null, url: "https://bad.test" },
      error: null,
    });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => client) }));
    vi.doMock("@/lib/env", () => ({ env: { supabaseUrl: "https://supabase.test" }, supabaseKey: "key" }));

    const { getPublishedListingBySlug } = await import("@/lib/public-listings");
    await expect(getPublishedListingBySlug("broken")).resolves.toBeNull();

    query.chain.maybeSingle.mockResolvedValueOnce({
      data: { name: "One", slug: "one", platform: "Web", description: null, url: "https://one.test" },
      error: null,
    });
    await expect(getPublishedListingBySlug(" ONE ")).resolves.toEqual({
      name: "One",
      slug: "one",
      platform: "Web",
      description: null,
      url: "https://one.test",
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
