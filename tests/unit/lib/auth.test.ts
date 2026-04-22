import { describe, expect, it, vi } from "vitest";

describe("lib/auth", () => {
  it("creates browser client once and guards missing env", async () => {
    vi.resetModules();
    vi.doMock("@supabase/ssr", () => ({ createBrowserClient: vi.fn(() => ({ kind: "browser" })) }));
    vi.doMock("@/lib/env", () => ({ env: { supabaseUrl: "https://supabase.test" }, supabaseKey: "key", hasSupabaseEnv: true }));

    const { createSupabaseBrowserClient } = await import("@/lib/auth");
    const first = createSupabaseBrowserClient();
    const second = createSupabaseBrowserClient();

    expect(first).toBe(second);
  });

  it("creates server client with cookie adapter", async () => {
    vi.resetModules();
    const createServerClient = vi.fn(() => ({ kind: "server" }));
    vi.doMock("@supabase/ssr", () => ({ createServerClient }));
    vi.doMock("@/lib/env", () => ({ env: { supabaseUrl: "https://supabase.test" }, supabaseKey: "key", hasSupabaseEnv: true }));

    const { createSupabaseServerClient } = await import("@/lib/auth");
    const cookies = [{ name: "sb", value: "abc" }];
    const setAll = vi.fn();

    const client = createSupabaseServerClient({ getAll: () => cookies, setAll });

    expect(client).toEqual({ kind: "server" });
    expect(createServerClient).toHaveBeenCalledWith(
      "https://supabase.test",
      "key",
      expect.objectContaining({ cookies: expect.any(Object) }),
    );
    const adapter = createServerClient.mock.calls[0][2].cookies;
    expect(adapter.getAll()).toEqual(cookies);
    adapter.setAll([{ name: "sb", value: "new" }]);
    expect(setAll).toHaveBeenCalledWith([{ name: "sb", value: "new" }]);
  });

  it("throws when supabase env missing", async () => {
    vi.resetModules();
    vi.doMock("@supabase/ssr", () => ({ createBrowserClient: vi.fn(), createServerClient: vi.fn() }));
    vi.doMock("@/lib/env", () => ({ env: { supabaseUrl: "", supabasePublishableKey: "", supabaseAnonKey: "" }, supabaseKey: "", hasSupabaseEnv: false }));
    const { createSupabaseBrowserClient } = await import("@/lib/auth");

    expect(() => createSupabaseBrowserClient()).toThrow(/Missing Supabase env vars/);
  });
});
