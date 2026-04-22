import { describe, expect, it } from "vitest";

import { render, screen } from "@/tests/utils/render";

import NewListingPage from "@/app/dashboard/listings/new/page";

describe("NewListingPage", () => {
  it("shows helper banner and browse trackers link", () => {
    render(<NewListingPage />);

    expect(
      screen.getByText(
        "Create a listing for a habit tracker (yours or one you found). You can publish later.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Creating listings is unavailable in static export mode."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse trackers" })).toHaveAttribute(
      "href",
      "/listings",
    );
  });
});
