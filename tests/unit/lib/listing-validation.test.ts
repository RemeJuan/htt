import { describe, expect, it } from "vitest";

import {
  isValidListingSlug,
  isValidListingUrl,
  listingFieldRequirements,
  listingStatusValues,
} from "@/lib/listing-validation";

describe("listing validation", () => {
  it("exports stable listing rules", () => {
    expect(listingStatusValues).toEqual(["draft", "published"]);
    expect(listingFieldRequirements.status).toBe("draft | published");

    expect(isValidListingSlug("habit-tracker-pro")).toBe(true);
    expect(isValidListingSlug("habit_tracker_pro")).toBe(false);
    expect(isValidListingSlug("Habit-Tracker-Pro")).toBe(false);
  });

  it("accepts only http and https urls", () => {
    expect(isValidListingUrl("https://example.com/tracker")).toBe(true);
    expect(isValidListingUrl("http://example.com/tracker")).toBe(true);
    expect(isValidListingUrl("ftp://example.com/tracker")).toBe(false);
    expect(isValidListingUrl("not-a-url")).toBe(false);
  });
});
