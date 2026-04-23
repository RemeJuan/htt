import { describe, expect, it, vi } from "vitest";

const getPublishedListingsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/public-listings", () => ({
  sanitizePublicListings: (value: unknown) =>
    Array.isArray(value)
      ? value.filter(
          (listing) =>
            listing &&
            typeof listing === "object" &&
            typeof (listing as { name?: unknown }).name === "string" &&
            typeof (listing as { slug?: unknown }).slug === "string" &&
            Array.isArray((listing as { platforms?: unknown }).platforms) &&
            typeof (listing as { urls?: unknown }).urls === "object",
        )
      : [],
  getPublishedListings: getPublishedListingsMock,
}));

import Home from "@/app/page";
import { render, screen } from "@/tests/utils/render";

describe("Home page", () => {
  it("renders primary content and key navigation links", async () => {
    getPublishedListingsMock.mockResolvedValueOnce([
      {
        name: "Habit Tracker Pro",
        slug: "habit-tracker-pro",
        platforms: ["Web"],
        urls: { web: "https://example.com" },
        website_url: "https://example.com",
        description: "Track habits.",
      },
      {
        name: "Loop Log",
        slug: "loop-log",
        platforms: ["iOS"],
        urls: { ios: "https://example.org" },
        website_url: "https://example.org",
        description: "Daily habit loops.",
      },
      {
        name: "Streak Stack",
        slug: "streak-stack",
        platforms: ["Android"],
        urls: { android: "https://example.net" },
        website_url: "https://example.net",
        description: "Stacked streaks.",
      },
    ]);

    render(await Home());

    expect(screen.getByRole("heading", { name: "Habit Tracker Tracker" })).toBeInTheDocument();
    expect(
      screen.getByText(/Thanks to vibe coding, everyone and their grandmother now has a/),
    ).toBeInTheDocument();
    expect(screen.getByText(/So how do you keep track of them all\?/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Introducing Habit Tracker Tracker -- a habit tracker for tracking your habit trackers\./,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("100% vibe coded. Probably secure.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse trackers" })).toHaveAttribute(
      "href",
      "/listings",
    );
    expect(screen.getByRole("link", { name: "Add a tracker" })).toHaveAttribute(
      "href",
      "/dashboard/listings/new",
    );
    expect(screen.getByRole("heading", { name: "Recent listings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Habit Tracker Pro" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Loop Log" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Streak Stack" })).toBeInTheDocument();
    expect(screen.queryByText("habit-tracker-pro")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all listings" })).toHaveAttribute(
      "href",
      "/listings",
    );
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/RemeJuan/htt",
    );

    expect(getPublishedListingsMock).toHaveBeenCalledWith({ sort: "newest", limit: 4 });
  });
});
