import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

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

vi.mock("@/components/listings/add-tracker-cta", () => ({
  AddTrackerCta: () => <button type="button">Add tracker</button>,
}));

import PublicListingsPage from "@/app/listings/page";
import ListingsLoading from "@/app/listings/loading";

describe("PublicListingsPage", () => {
  it("shows the empty state when nothing is published", async () => {
    getPublishedListingsMock.mockResolvedValueOnce([]);

    render(await PublicListingsPage());

    expect(
      screen.getByText("Track the trackers you’ve built or found. Not habits."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No trackers yet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add tracker" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute("href", "/");
  });

  it("has no obvious accessibility violations on the empty state", async () => {
    getPublishedListingsMock.mockResolvedValueOnce([]);

    const { container } = render(await PublicListingsPage());

    const results = await axe(container);

    expect(results.violations).toEqual([]);
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
    expect(screen.getByRole("heading", { level: 1, name: "Listings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Habit Tracker Pro" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Habit Tracker Pro" }),
    ).toBeInTheDocument();
  });

  it("keeps the empty state stable when fetch fails", async () => {
    getPublishedListingsMock.mockRejectedValueOnce(new Error("boom"));

    render(await PublicListingsPage());

    expect(screen.getByRole("heading", { name: "No trackers yet" })).toBeInTheDocument();
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

  it("has no obvious accessibility violations on published listings", async () => {
    getPublishedListingsMock.mockResolvedValueOnce([
      {
        name: "Habit Tracker Pro",
        slug: "habit-tracker-pro",
        platform: "Web",
        description: null,
        url: "https://example.com",
      },
    ]);

    const { container } = render(await PublicListingsPage());

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });

  it("keeps listing links keyboard focusable", async () => {
    const user = userEvent.setup();

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

    await user.tab();
    expect(screen.getByRole("link", { name: "View details" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Visit site" })).toHaveFocus();
  });

  it("renders accessible loading state", async () => {
    const { container } = render(<ListingsLoading />);

    expect(screen.getByRole("heading", { name: "Loading listings" })).toBeInTheDocument();

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });
});
