import { describe, expect, it } from "vitest";

import { getCardExcerpt } from "@/lib/card-excerpt";

describe("getCardExcerpt", () => {
  it("keeps the first useful sentence", () => {
    expect(
      getCardExcerpt(
        "Fast focus for busy teams that want a cleaner tracker.\n\nMain Features:\n• Weekly plans\n• Smart nudges",
      ),
    ).toBe("Fast focus for busy teams that want a cleaner tracker");
  });

  it("falls back to truncation for short first sentences and strips list noise", () => {
    expect(
      getCardExcerpt(
        "Simple.\n\n• Weekly plans\n• Smart nudges\nA longer clean description that stays readable and should survive the 140 character fallback without raw bullets.",
      ),
    ).toBe(
      "Simple. A longer clean description that stays readable and should survive the 140 character fallback without raw bullets.",
    );
  });

  it("truncates long prose with an ellipsis", () => {
    const excerpt = getCardExcerpt(
      "This sentence is intentionally long so it misses the excerpt sweet spot and gets truncated for a consistent card preview, even though it stays clean.",
    );

    expect(excerpt.endsWith("…")).toBe(true);
    expect(excerpt.length).toBe(141);
  });
});
