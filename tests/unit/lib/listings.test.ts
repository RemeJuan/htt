// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseClientMock, createSupabaseQueryMock } from "./supabase-mock";

describe("lib/listings", () => {
  it("throws normalized errors for read helpers", async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));

    const query = createSupabaseQueryMock({ data: null, error: { message: "read fail" } });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@/lib/supabase-server", () => ({ getSupabaseServerClient: vi.fn(async () => client) }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

    const lib = await import("@/lib/listings");

    await expect(lib.getOwnListings("user")).rejects.toThrow("read fail");
    await expect(lib.getPublishedListings()).rejects.toThrow("read fail");
    await expect(lib.getPublishedListingBySlug("slug")).rejects.toThrow("read fail");
    await expect(lib.getOwnListingById("user", "1")).rejects.toThrow("read fail");
  });

  it("returns own listings and normalizes empty/error states", async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));

    const query = createSupabaseQueryMock({ data: null, error: null });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@/lib/supabase-server", () => ({ getSupabaseServerClient: vi.fn(async () => client) }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

    const lib = await import("@/lib/listings");

    await expect(lib.getOwnListings("user")).resolves.toEqual([]);

    await expect(lib.getOwnListingById("user", "1")).resolves.toBeNull();
  });

  it("trims published filters and returns empty rows safely", async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));

    const query = createSupabaseQueryMock({ data: null, error: null });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@/lib/supabase-server", () => ({ getSupabaseServerClient: vi.fn(async () => client) }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

    const lib = await import("@/lib/listings");

    await expect(
      lib.getPublishedListings({ search: " tracker ", platform: " ios ", sort: "newest" }),
    ).resolves.toEqual([]);
    expect(query.chain.eq).toHaveBeenCalledWith("status", "published");
    expect(query.chain.ilike).toHaveBeenNthCalledWith(1, "name", "%tracker%");
    expect(query.chain.ilike).toHaveBeenNthCalledWith(2, "platform", "%ios%");
    expect(query.chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("normalizes slug lookups and row misses", async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));

    const query = createSupabaseQueryMock({ data: null, error: null });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@/lib/supabase-server", () => ({ getSupabaseServerClient: vi.fn(async () => client) }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

    const lib = await import("@/lib/listings");

    await expect(lib.getPublishedListingBySlug(" SLUG ")).resolves.toBeNull();
    expect(query.chain.eq).toHaveBeenNthCalledWith(1, "status", "published");
    expect(query.chain.eq).toHaveBeenNthCalledWith(2, "slug", "slug");
    await expect(lib.getOwnListingById("user", "missing")).resolves.toBeNull();
  });

  it("returns null or false when update and delete miss rows", async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));

    const query = createSupabaseQueryMock({ data: null, error: null });
    const client = createSupabaseClientMock({ listings: query });
    vi.doMock("@/lib/supabase-server", () => ({ getSupabaseServerClient: vi.fn(async () => client) }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

    const lib = await import("@/lib/listings");
    const input = { name: "n", slug: "s", platform: "p", url: "u", description: null, status: "draft", is_claimed: false } as const;

    await expect(lib.updateListing("user", "1", input)).resolves.toBeNull();
    await expect(lib.deleteListing("user", "1")).resolves.toBe(false);
  });

  it("sends mutation payloads and logs failures", async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));

    const query = createSupabaseQueryMock({
      data: { id: "1", user_id: "user" },
      error: null,
    });
    const client = createSupabaseClientMock({ listings: query });
    const logger = { error: vi.fn() };
    vi.doMock("@/lib/supabase-server", () => ({ getSupabaseServerClient: vi.fn(async () => client) }));
    vi.doMock("@/lib/logger", () => ({ logger }));

    const lib = await import("@/lib/listings");
    const input = { name: "n", slug: "s", platform: "p", url: "u", description: null, status: "draft", is_claimed: false } as const;

    await expect(lib.createListing("user", input)).resolves.toEqual({ id: "1", user_id: "user" });
    expect(query.chain.insert).toHaveBeenCalledWith({
      user_id: "user",
      ...input,
    });

    await expect(lib.updateListing("user", "1", input)).resolves.toEqual({ id: "1", user_id: "user" });
    expect(query.chain.update).toHaveBeenCalledWith({
      name: "n",
      slug: "s",
      platform: "p",
      url: "u",
      description: null,
      status: "draft",
      is_claimed: false,
    });
    expect(query.chain.eq).toHaveBeenNthCalledWith(1, "user_id", "user");
    expect(query.chain.eq).toHaveBeenNthCalledWith(2, "id", "1");

    await expect(lib.deleteListing("user", "1")).resolves.toBe(true);
    expect(query.chain.delete).toHaveBeenCalled();
    expect(query.chain.eq).toHaveBeenNthCalledWith(3, "user_id", "user");
    expect(query.chain.eq).toHaveBeenNthCalledWith(4, "id", "1");

    query.chain.single.mockResolvedValueOnce({ data: null, error: { message: "create" } });
    await expect(lib.createListing("user", input)).rejects.toThrow("create");
    query.chain.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "update" } });
    await expect(lib.updateListing("user", "1", input)).rejects.toThrow("update");
    query.chain.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "delete" } });
    await expect(lib.deleteListing("user", "1")).rejects.toThrow("delete");

    expect(logger.error).toHaveBeenCalled();
  });
});
