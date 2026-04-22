import { describe, expect, it, vi } from "vitest";

import { createSupabaseClientMock, createSupabaseQueryMock } from "./supabase-mock";

describe("lib/public-listings", () => {
  it("returns published listings with filters", async () => {
    vi.resetModules();
    const query = createSupabaseQueryMock({
      data: [
        { name: "One", slug: "one", platform: "Web", description: null, url: "https://one.test" },
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
    const result = await getPublishedListings({
      search: " tracker ",
      platform: " ios ",
      sort: "oldest",
    });

    expect(result).toEqual([
      { name: "One", slug: "one", platform: "Web", description: null, url: "https://one.test" },
    ]);
    expect(query.chain.select).toHaveBeenCalledWith("name, slug, platform, description, url");
    expect(query.chain.eq).toHaveBeenCalledWith("status", "published");
    expect(query.chain.ilike).toHaveBeenNthCalledWith(1, "name", "%tracker%");
    expect(query.chain.ilike).toHaveBeenNthCalledWith(2, "platform", "%ios%");
    expect(query.state.order).toEqual([{ column: "created_at", options: { ascending: true } }]);
  });

  it("filters malformed published rows", async () => {
    vi.resetModules();
    const query = createSupabaseQueryMock({
      data: [
        { name: "One", slug: "one", platform: "Web", description: null, url: "https://one.test" },
        { name: "Broken", slug: 123, platform: "Web", description: null, url: "https://bad.test" },
        null,
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

    await expect(getPublishedListings()).resolves.toEqual([
      { name: "One", slug: "one", platform: "Web", description: null, url: "https://one.test" },
    ]);
  });

  it("normalizes slugs and returns null on query error", async () => {
    vi.resetModules();
    const query = createSupabaseQueryMock({ data: null, error: { message: "boom" } });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => client) }));
    vi.doMock("@/lib/env", () => ({
      env: { supabaseUrl: "https://supabase.test" },
      supabaseKey: "key",
    }));

    const { getPublishedListingBySlug } = await import("@/lib/public-listings");
    await expect(getPublishedListingBySlug(" SLUG ")).resolves.toBeNull();
    expect(query.chain.eq).toHaveBeenNthCalledWith(2, "slug", "slug");
  });

  it("returns null for malformed slug records", async () => {
    vi.resetModules();
    const query = createSupabaseQueryMock({
      data: {
        name: "Broken",
        slug: null,
        platform: "Web",
        description: null,
        url: "https://bad.test",
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
  });

  it("defaults sort to newest", async () => {
    vi.resetModules();
    const query = createSupabaseQueryMock({ data: [], error: null });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => client) }));
    vi.doMock("@/lib/env", () => ({
      env: { supabaseUrl: "https://supabase.test" },
      supabaseKey: "key",
    }));

    const { getPublishedListings } = await import("@/lib/public-listings");
    await getPublishedListings();

    expect(query.chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});
