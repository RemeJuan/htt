import { describe, expect, it } from "vitest";

import { withBasePath } from "@/lib/site-path";

describe("site-path", () => {
  it("returns paths unchanged", () => {
    expect(withBasePath("/logo.png")).toBe("/logo.png");
  });
});
