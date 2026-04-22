import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@/tests/utils/render";

vi.mock("@/lib/public-listings", () => ({
  getPublishedListings: vi.fn().mockResolvedValue([]),
  sanitizePublicListings: vi.fn((listings) => listings),
}));

vi.mock("@/components/listings/add-tracker-cta", () => ({
  AddTrackerCta: () => <button type="button">Add tracker</button>,
}));

import PublicListingsPage from "@/app/listings/page";

describe("PublicListingsPage", () => {
  it("renders empty state copy and back home link", async () => {
    render(await PublicListingsPage());

    expect(
      screen.getByText("Track the trackers you’ve built or found. Not habits."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No trackers yet" })).toBeInTheDocument();
    expect(
      screen.getByText("Be the first to add a habit tracker to the tracker."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add tracker" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute("href", "/");
  });
});
