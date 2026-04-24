import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@/tests/utils/render";

const searchParamsGetMock = vi.hoisted(() => vi.fn(() => null));
const searchParamsToStringMock = vi.hoisted(() => vi.fn(() => ""));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/listings",
  useSearchParams: () => ({ get: searchParamsGetMock, toString: searchParamsToStringMock }),
}));

vi.mock("@/lib/public-listings", () => ({
  PUBLIC_LISTINGS_PAGE_SIZE: 20,
  getPublishedListingsPage: vi
    .fn()
    .mockResolvedValue({ items: [], hasMore: false, nextCursor: null }),
}));

vi.mock("@/components/listings/add-tracker-cta", () => ({
  AddTrackerCta: () => <button type="button">Add tracker</button>,
}));

import PublicListingsPage from "@/app/listings/page";

describe("PublicListingsPage", () => {
  it("renders empty state copy and back home link", async () => {
    render(await PublicListingsPage({ searchParams: Promise.resolve({}) }));

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
