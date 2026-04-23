import { describe, expect, it } from "vitest";

import {
  appStoreUrl,
  buildImportedSlug,
  normalizeResult,
  parseArgs,
  pickAvailableSlug,
  uniqueByTrackId,
} from "../../../scripts/import-ios.mjs";

describe("import ios script helpers", () => {
  it("parses env defaults and cli overrides", () => {
    const options = parseArgs(["--country=US", "--limit=12", "--terms=focus timer,habit"], {
      IOS_IMPORT_COUNTRY: "ZA",
      IOS_IMPORT_LIMIT: "8",
      IOS_IMPORT_TERMS: "journaling,productivity",
    });

    expect(options).toEqual({
      country: "US",
      limit: 12,
      terms: ["focus timer", "habit"],
    });
  });

  it("dedupes by track id and normalizes listing shape", () => {
    const normalized = normalizeResult({
      trackId: 123,
      trackName: "Focus Flow",
      sellerUrl: "https://focus.example.com",
      description: "Task planner",
    });

    expect(normalized).toEqual({
      trackId: "123",
      name: "Focus Flow",
      slug: "focus-flow-123",
      urls: { ios: appStoreUrl("123") },
      website_url: "https://focus.example.com",
      description: "Task planner",
      platforms: ["iOS"],
      status: "draft",
      is_claimed: false,
    });

    expect(
      uniqueByTrackId([{ trackId: 1 }, { trackId: 1 }, { trackId: 2 }, { trackId: null }]),
    ).toEqual([{ trackId: 1 }, { trackId: 2 }]);
  });

  it("builds stable collision-resistant import slugs", () => {
    expect(buildImportedSlug("Focus Flow", "12345")).toBe("focus-flow-12345");
    expect(pickAvailableSlug("focus-flow-12345", "12345", new Set())).toBe("focus-flow-12345");
    expect(pickAvailableSlug("focus-flow-12345", "12345", new Set(["focus-flow-12345"]))).toBe(
      "ios-12345",
    );
  });
});
