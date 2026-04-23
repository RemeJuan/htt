import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { render, screen } from "@/tests/utils/render";

const getPublishedListingBySlugMock = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("@/lib/public-listings", () => ({
  sanitizePublicListing: (value: unknown) =>
    value &&
    typeof value === "object" &&
    typeof (value as { name?: unknown }).name === "string" &&
    typeof (value as { slug?: unknown }).slug === "string" &&
    Array.isArray((value as { platforms?: unknown }).platforms) &&
    typeof (value as { urls?: unknown }).urls === "object"
      ? value
      : null,
  getPublishedListingBySlug: getPublishedListingBySlugMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

import ListingNotFound from "@/app/listings/[slug]/not-found";
import ListingLoading from "@/app/listings/[slug]/loading";
import PublicListingPage, { generateMetadata } from "@/app/listings/[slug]/page";

describe("PublicListingPage", () => {
  it("renders published listing details", async () => {
    getPublishedListingBySlugMock.mockResolvedValueOnce({
      name: "Habit Tracker Pro",
      slug: "habit-tracker-pro",
      platforms: ["iOS"],
      urls: { ios: "https://example.com" },
      description: "Track habits.",
      website_url: "https://example.com",
      status: "Published",
    });

    render(await PublicListingPage({ params: Promise.resolve({ slug: "Habit-Tracker-Pro" }) }));

    expect(getPublishedListingBySlugMock).toHaveBeenCalledWith("Habit-Tracker-Pro");
    expect(screen.getByRole("heading", { name: "Habit Tracker Pro" })).toBeInTheDocument();
    expect(screen.queryByText("habit-tracker-pro")).not.toBeInTheDocument();
    expect(screen.getByText("Public listing")).toBeInTheDocument();
    expect(screen.getAllByText("iOS").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Open website" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
    expect(screen.getByRole("link", { name: "Open iOS" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
    expect(screen.getByRole("link", { name: "Back to listings" })).toHaveAttribute(
      "href",
      "/listings",
    );
  });

  it("has no obvious accessibility violations on the detail page", async () => {
    getPublishedListingBySlugMock.mockResolvedValueOnce({
      name: "Habit Tracker Pro",
      slug: "habit-tracker-pro",
      platforms: ["Web"],
      urls: { web: "https://example.com" },
      description: "Track habits.",
      website_url: "https://example.com",
      status: "Published",
    });

    const { container } = render(
      await PublicListingPage({ params: Promise.resolve({ slug: "habit-tracker-pro" }) }),
    );

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });

  it("keeps detail links keyboard focusable", async () => {
    const user = userEvent.setup();

    getPublishedListingBySlugMock.mockResolvedValueOnce({
      name: "Habit Tracker Pro",
      slug: "habit-tracker-pro",
      platforms: ["Web"],
      urls: { web: "https://example.com" },
      description: "Track habits.",
      website_url: "https://example.com",
      status: "Published",
    });

    render(await PublicListingPage({ params: Promise.resolve({ slug: "habit-tracker-pro" }) }));

    await user.tab();
    expect(screen.getByRole("link", { name: "Open website" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Open Web" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Back to listings" })).toHaveFocus();
  });

  it("calls notFound for missing or unpublished listings", async () => {
    getPublishedListingBySlugMock.mockResolvedValueOnce(null);

    await expect(
      PublicListingPage({ params: Promise.resolve({ slug: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalled();
  });

  it("calls notFound for malformed listing data", async () => {
    getPublishedListingBySlugMock.mockResolvedValueOnce({
      name: "Broken",
      slug: null,
      platforms: [],
      urls: {},
      description: null,
      website_url: null,
      status: "Published",
    });

    await expect(
      PublicListingPage({ params: Promise.resolve({ slug: "broken" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("keeps metadata fallback on fetch failure", async () => {
    getPublishedListingBySlugMock.mockRejectedValueOnce(new Error("boom"));

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "missing" }) }),
    ).resolves.toEqual({
      title: "Listing not found",
    });
  });
});

describe("listing route helpers", () => {
  it("returns fallback metadata for missing listings", async () => {
    getPublishedListingBySlugMock.mockResolvedValueOnce(null);

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "missing" }) }),
    ).resolves.toEqual({
      title: "Listing not found",
    });
  });
});

describe("Listing route states", () => {
  it("renders loading state", () => {
    render(<ListingLoading />);

    expect(screen.getByRole("heading", { name: "Loading listing" })).toBeInTheDocument();
  });

  it("has no obvious accessibility violations in loading and not-found states", async () => {
    const loading = render(<ListingLoading />);
    const notFound = render(<ListingNotFound />);

    const loadingResults = await axe(loading.container);
    const notFoundResults = await axe(notFound.container);

    expect(loadingResults.violations).toEqual([]);
    expect(notFoundResults.violations).toEqual([]);
  });

  it("renders not-found state", () => {
    render(<ListingNotFound />);

    expect(screen.getByRole("heading", { name: "Listing not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to listings" })).toHaveAttribute(
      "href",
      "/listings",
    );
  });
});
