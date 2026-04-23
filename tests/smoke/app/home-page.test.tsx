import { describe, expect, it } from "vitest";

import Home from "@/app/page";
import { render, screen } from "@/tests/utils/render";

describe("Home page", () => {
  it("renders primary content and key navigation links", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Habit Tracker Tracker" })).toBeInTheDocument();
    expect(
      screen.getByText(/Thanks to vibe coding, everyone and their grandmother now has a/),
    ).toBeInTheDocument();
    expect(screen.getByText(/So how do you keep track of them all\?/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Introducing Habit Tracker Tracker -- a habit tracker for tracking your habit trackers\./,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("100% vibe coded. Probably secure.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse trackers" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: "Add a tracker" })).toHaveAttribute(
      "href",
      "/listings",
    );
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/RemeJuan/htt",
    );
  });
});
