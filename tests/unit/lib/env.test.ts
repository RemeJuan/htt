import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishable: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

function setEnv(values: Partial<typeof originalEnv>) {
  const nextValues = {
    url: values.url ?? undefined,
    publishable: values.publishable ?? undefined,
    anon: values.anon ?? undefined,
  };

  if (nextValues.url === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = nextValues.url;
  }

  if (nextValues.publishable === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = nextValues.publishable;
  }

  if (nextValues.anon === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = nextValues.anon;
  }
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  setEnv(originalEnv);
});

describe("env", () => {
  it("prefers the publishable key over the anon key", async () => {
    setEnv({
      url: "https://example.supabase.co",
      publishable: "sb_publishable_test",
      anon: "anon_test",
    });

    const { hasSupabaseEnv, supabaseKey } = await import("@/lib/env");

    expect(supabaseKey).toBe("sb_publishable_test");
    expect(hasSupabaseEnv).toBe(true);
  });

  it("reports missing Supabase env when either part is absent", async () => {
    setEnv({ url: "", publishable: "", anon: "" });

    const { hasSupabaseEnv } = await import("@/lib/env");

    expect(hasSupabaseEnv).toBe(false);
  });
});
