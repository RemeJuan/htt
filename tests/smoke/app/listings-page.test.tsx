import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { render, screen } from "@/tests/utils/render";

const getPublishedListingsMock = vi.hoisted(() => vi.fn());
const searchParamsGetMock = vi.hoisted(() => vi.fn(() => null));
const searchParamsToStringMock = vi.hoisted(() => vi.fn(() => ""));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/listings",
  useSearchParams: () => ({ get: searchParamsGetMock, toString: searchParamsToStringMock }),
}));

vi.mock("@/lib/public-listings", () => ({
  PUBLIC_LISTINGS_PAGE_SIZE: 20,
  getPublishedListingsPage: getPublishedListingsMock,
}));

vi.mock("@/components/listings/add-tracker-cta", () => ({
  AddTrackerCta: () => <button type="button">Add tracker</button>,
}));

import PublicListingsPage from "@/app/listings/page";
import ListingsLoading from "@/app/listings/loading";

describe("PublicListingsPage", () => {
  beforeEach(() => {
    searchParamsGetMock.mockReset();
    searchParamsToStringMock.mockReset();
    searchParamsGetMock.mockReturnValue(null);
    searchParamsToStringMock.mockReturnValue("");
  });

  it("shows the empty state when nothing is published", async () => {
    getPublishedListingsMock.mockResolvedValueOnce({ items: [], hasMore: false, nextCursor: null });

    render(await PublicListingsPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByText("Track the trackers you’ve built or found. Not habits."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No trackers yet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add tracker" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute("href", "/");
  });

  it("has no obvious accessibility violations on the empty state", async () => {
    getPublishedListingsMock.mockResolvedValueOnce({ items: [], hasMore: false, nextCursor: null });

    const { container } = render(await PublicListingsPage({ searchParams: Promise.resolve({}) }));

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });

  it("renders the page header and published listing state", async () => {
    getPublishedListingsMock.mockResolvedValueOnce({
      items: [
        {
          name: "Habit Tracker Pro",
          slug: "habit-tracker-pro",
          platforms: ["Web"],
          urls: { web: "https://example.com" },
          website_url: "https://example.com",
          description: null,
        },
      ],
      hasMore: true,
      nextCursor: "cursor",
    });

    render(await PublicListingsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Listings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Habit Tracker Pro" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Habit Tracker Pro" }),
    ).toBeInTheDocument();
  });

  it("shows an error state when fetch fails", async () => {
    getPublishedListingsMock.mockRejectedValueOnce(new Error("boom"));

    render(await PublicListingsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Couldn’t load listings" })).toBeInTheDocument();
  });

  it("filters malformed listings before rendering cards", async () => {
    getPublishedListingsMock.mockResolvedValueOnce({
      items: [
        {
          name: "Good",
          slug: "good",
          platforms: ["Web"],
          urls: { web: "https://good.test" },
          website_url: "https://good.test",
          description: null,
        },
      ],
      hasMore: false,
      nextCursor: null,
    });

    render(await PublicListingsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Good" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Broken" })).not.toBeInTheDocument();
  });

  it("renders published listing cards", async () => {
    getPublishedListingsMock.mockResolvedValueOnce({
      items: [
        {
          name: "Habit Tracker Pro",
          slug: "habit-tracker-pro",
          platforms: ["Web"],
          urls: { web: "https://example.com" },
          website_url: "https://example.com",
          description: "First paragraph shown.\n\nSecond paragraph hidden in compact cards.",
        },
      ],
      hasMore: false,
      nextCursor: null,
    });

    render(await PublicListingsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Habit Tracker Pro" })).toBeInTheDocument();
    expect(screen.queryByText("/habit-tracker-pro")).not.toBeInTheDocument();
    expect(
      screen.getByText("First paragraph shown. Second paragraph hidden in compact cards."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View details for Habit Tracker Pro" }),
    ).toHaveAttribute("href", "/listings/habit-tracker-pro");
  });

  it("renders compact published listings without slug text", async () => {
    getPublishedListingsMock.mockResolvedValueOnce({
      items: [
        {
          name: "Habit Tracker Pro",
          slug: "habit-tracker-pro",
          platforms: ["Web"],
          urls: { web: "https://example.com" },
          website_url: "https://example.com",
          description: null,
        },
      ],
      hasMore: false,
      nextCursor: null,
    });

    render(await PublicListingsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Habit Tracker Pro" })).toBeInTheDocument();
    expect(screen.queryByText("habit-tracker-pro")).not.toBeInTheDocument();
    expect(
      screen.queryByText("A very long description that should stay hidden in compact cards."),
    ).not.toBeInTheDocument();
  });

  it("keeps listing links keyboard focusable", async () => {
    const user = userEvent.setup();

    getPublishedListingsMock.mockResolvedValueOnce({
      items: [
        {
          name: "Habit Tracker Pro",
          slug: "habit-tracker-pro",
          platforms: ["Web"],
          urls: { web: "https://example.com" },
          website_url: "https://example.com",
          description: null,
        },
      ],
      hasMore: false,
      nextCursor: null,
    });

    render(await PublicListingsPage({ searchParams: Promise.resolve({}) }));

    await user.tab();
    expect(screen.getByLabelText("Search listings")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Habit Tracker Pro" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "View details for Habit Tracker Pro" })).toHaveFocus();
  });

  it("keeps the search input focused when results refresh", async () => {
    const user = userEvent.setup();

    getPublishedListingsMock.mockResolvedValueOnce({
      items: [
        {
          name: "Habit Tracker Pro",
          slug: "habit-tracker-pro",
          platforms: ["Web"],
          urls: { web: "https://example.com" },
          website_url: "https://example.com",
          description: null,
        },
      ],
      hasMore: true,
      nextCursor: "cursor",
    });

    searchParamsGetMock.mockImplementation((key: string) => (key === "q" ? "streak" : null));
    searchParamsToStringMock.mockReturnValue("q=streak");

    render(await PublicListingsPage({ searchParams: Promise.resolve({ q: "streak" }) }));

    await user.click(screen.getByLabelText("Search listings"));
    expect(screen.getByLabelText("Search listings")).toHaveFocus();
    expect(screen.getByLabelText("Search listings")).toHaveValue("streak");
  });

  it("renders accessible loading state", async () => {
    const { container } = render(<ListingsLoading />);

    expect(screen.getByRole("heading", { name: "Loading listings" })).toBeInTheDocument();

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });

  it("passes search query into the listings fetch", async () => {
    getPublishedListingsMock.mockResolvedValueOnce({ items: [], hasMore: false, nextCursor: null });

    await PublicListingsPage({ searchParams: Promise.resolve({ q: " streak " }) });

    expect(getPublishedListingsMock).toHaveBeenCalledWith({ limit: 20, search: "streak" });
  });

  it("shows search empty state for no matching listings", async () => {
    getPublishedListingsMock.mockResolvedValueOnce({ items: [], hasMore: false, nextCursor: null });
    searchParamsGetMock.mockImplementation((key: string) => (key === "q" ? "streak" : null));
    searchParamsToStringMock.mockReturnValue("q=streak");

    render(await PublicListingsPage({ searchParams: Promise.resolve({ q: "streak" }) }));

    expect(
      screen.getByRole("heading", { name: "No listings found for “streak”" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Search goblin found nothing.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
  });
});
