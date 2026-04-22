import { afterEach, describe, expect, it, vi } from "vitest";

const original = process.env.NEXT_PUBLIC_BASE_PATH;

afterEach(() => {
  process.env.NEXT_PUBLIC_BASE_PATH = original;
});

describe("site-path", () => {
  it("normalizes base path and prefixes paths", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_BASE_PATH = "/base/";
    const mod = await import("@/lib/site-path");

    expect(mod.basePath).toBe("/base");
    expect(mod.withBasePath("/logo.png")).toBe("/base/logo.png");
    expect(mod.withBasePath("base/logo.png")).toBe("/base/base/logo.png");
  });

  it("treats root base path as empty", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_BASE_PATH = "/";
    const mod = await import("@/lib/site-path");

    expect(mod.basePath).toBe("");
    expect(mod.withBasePath("/logo.png")).toBe("/logo.png");
  });
});
