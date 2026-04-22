import { describe, expect, it, vi } from "vitest";

describe("lib/supabase", () => {
  it("re-exports auth and env helpers", async () => {
    vi.resetModules();
    const createSupabaseBrowserClient = vi.fn();
    const hasSupabaseEnv = true;

    vi.doMock("@/lib/auth", () => ({ createSupabaseBrowserClient }));
    vi.doMock("@/lib/env", () => ({ hasSupabaseEnv }));

    const mod = await import("@/lib/supabase");

    expect(mod.getSupabaseBrowserClient).toBe(createSupabaseBrowserClient);
    expect(mod.isSupabaseConfigured).toBe(true);
  });
});
