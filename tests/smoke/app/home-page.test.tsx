import { describe, expect, it } from "vitest";

import Home from "@/app/page";
import { render, screen } from "@/tests/utils/render";

describe("Home page", () => {
  it("renders primary content and key navigation links", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Track the habit trackers." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse trackers" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Add a tracker" })).toHaveAttribute("href", "/listings");
  });
});
