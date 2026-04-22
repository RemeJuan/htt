import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@/tests/utils/render";

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
            typeof (listing as { platform?: unknown }).platform === "string" &&
            typeof (listing as { url?: unknown }).url === "string",
        )
      : [],
  getPublishedListings: getPublishedListingsMock,
}));

import PublicListingsPage from "@/app/listings/page";

describe("PublicListingsPage", () => {
  it("shows the empty state when nothing is published", async () => {
    getPublishedListingsMock.mockResolvedValueOnce([]);

    render(await PublicListingsPage());

    expect(screen.getByRole("heading", { name: "No published listings yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute("href", "/");
  });

  it("renders the page header and published listing state", async () => {
    getPublishedListingsMock.mockResolvedValueOnce([
      {
        name: "Habit Tracker Pro",
        slug: "habit-tracker-pro",
        platform: "Web",
        description: null,
        url: "https://example.com",
      },
    ]);

    render(await PublicListingsPage());

    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Habit Tracker Pro" })).toBeInTheDocument();
  });

  it("keeps the empty state stable when fetch fails", async () => {
    getPublishedListingsMock.mockRejectedValueOnce(new Error("boom"));

    render(await PublicListingsPage());

    expect(screen.getByRole("heading", { name: "No published listings yet" })).toBeInTheDocument();
  });

  it("filters malformed listings before rendering cards", async () => {
    getPublishedListingsMock.mockResolvedValueOnce([
      { name: "Good", slug: "good", platform: "Web", description: null, url: "https://good.test" },
      { name: "Broken", slug: null, platform: "Web", description: null, url: "https://bad.test" },
    ]);

    render(await PublicListingsPage());

    expect(screen.getByRole("heading", { name: "Good" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Broken" })).not.toBeInTheDocument();
  });

  it("renders published listing cards", async () => {
    getPublishedListingsMock.mockResolvedValueOnce([
      {
        name: "Habit Tracker Pro",
        slug: "habit-tracker-pro",
        platform: "Web",
        description: null,
        url: "https://example.com",
      },
    ]);

    render(await PublicListingsPage());

    expect(screen.getByRole("heading", { name: "Habit Tracker Pro" })).toBeInTheDocument();
    expect(screen.getByText("/habit-tracker-pro")).toBeInTheDocument();
    expect(screen.getByText("Platform:")).toBeInTheDocument();
    expect(screen.getByText("No description provided.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute(
      "href",
      "/listings/habit-tracker-pro",
    );
    expect(screen.getByRole("link", { name: "Visit site" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });
});
