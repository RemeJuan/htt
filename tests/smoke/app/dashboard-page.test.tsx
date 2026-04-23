import { describe, expect, it, vi } from "vitest";

const requireAuthenticatedUserMock = vi.hoisted(() => vi.fn());
const getOwnListingsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-user", () => ({
  requireAuthenticatedUser: requireAuthenticatedUserMock,
}));
vi.mock("@/lib/listings", () => ({
  getOwnListings: getOwnListingsMock,
}));

import DashboardPage from "@/app/dashboard/page";
import { render, screen } from "@/tests/utils/render";

describe("DashboardPage", () => {
  it("renders dashboard actions for authenticated users", async () => {
    requireAuthenticatedUserMock.mockResolvedValue({ id: "user-1", email: "me@example.com" });
    getOwnListingsMock.mockResolvedValue([{ id: "listing-1" }]);

    render(await DashboardPage());

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(
      screen.getByText("Signed in as me@example.com. Manage your private listings here."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add tracker" })).toHaveAttribute(
      "href",
      "/dashboard/listings/new",
    );
    expect(screen.getByRole("link", { name: "View public listings" })).toHaveAttribute(
      "href",
      "/listings",
    );
  });
});
