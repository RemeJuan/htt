import { describe, expect, it, vi } from "vitest";

describe("lib/supabase-server", () => {
  it("wires next cookies into server client", async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));
    const createServerClient = vi.fn(() => ({ kind: "server" }));
    const cookieStore = { getAll: vi.fn(() => [{ name: "a", value: "1" }]), set: vi.fn() };
    vi.doMock("@supabase/ssr", () => ({ createServerClient }));
    vi.doMock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));
    vi.doMock("@/lib/env", () => ({ env: { supabaseUrl: "https://supabase.test" }, supabaseKey: "key" }));

    const { getSupabaseServerClient } = await import("@/lib/supabase-server");
    const client = await getSupabaseServerClient();
    const adapter = createServerClient.mock.calls[0][2].cookies;

    expect(client).toEqual({ kind: "server" });
    expect(adapter.getAll()).toEqual([{ name: "a", value: "1" }]);
    expect(cookieStore.getAll).toHaveBeenCalled();
    adapter.setAll([{ name: "sb", value: "x" }]);
    expect(cookieStore.set).toHaveBeenCalledWith("sb", "x", undefined);
  });

  it("swallows cookie write failures", async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));
    const createServerClient = vi.fn(() => ({ kind: "server" }));
    const cookieStore = { getAll: vi.fn(() => []), set: vi.fn(() => { throw new Error("readonly"); }) };
    vi.doMock("@supabase/ssr", () => ({ createServerClient }));
    vi.doMock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));
    vi.doMock("@/lib/env", () => ({ env: { supabaseUrl: "https://supabase.test" }, supabaseKey: "key" }));

    const { getSupabaseServerClient } = await import("@/lib/supabase-server");
    const client = await getSupabaseServerClient();
    const adapter = createServerClient.mock.calls[0][2].cookies;

    expect(() => adapter.setAll([{ name: "sb", value: "x" }])).not.toThrow();
    expect(client).toEqual({ kind: "server" });
  });
});
