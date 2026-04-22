import { describe, expect, it } from "vitest";

import DashboardPage from "@/app/dashboard/page";
import { render, screen } from "@/tests/utils/render";

describe("DashboardPage", () => {
  it("renders the public listings link", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View public listings" })).toHaveAttribute(
      "href",
      "/listings",
    );
  });
});
