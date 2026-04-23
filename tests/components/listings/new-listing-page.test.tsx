import { describe, expect, it, vi } from "vitest";

const requireAuthenticatedUserMock = vi.hoisted(() => vi.fn());
const listingFormMock = vi.hoisted(() => vi.fn(() => <div data-testid="listing-form" />));
const createListingActionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-user", () => ({
  requireAuthenticatedUser: requireAuthenticatedUserMock,
}));
vi.mock("@/components/listings/listing-form", () => ({
  ListingForm: listingFormMock,
}));
vi.mock("@/app/dashboard/listings/actions", () => ({
  createListingAction: createListingActionMock,
}));

import { render, screen } from "@/tests/utils/render";

import NewListingPage from "@/app/dashboard/listings/new/page";

describe("NewListingPage", () => {
  it("shows helper banner and runtime-backed listing form", async () => {
    requireAuthenticatedUserMock.mockResolvedValue({ id: "user-1" });

    render(await NewListingPage());

    expect(
      screen.getByText(
        "Create a listing for a habit tracker (yours or one you found). You can publish later.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("listing-form")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to listings" })).toHaveAttribute(
      "href",
      "/dashboard/listings",
    );
  });
});
