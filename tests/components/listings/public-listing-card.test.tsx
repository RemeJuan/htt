import { describe, expect, it } from "vitest";

import { render, screen } from "@/tests/utils/render";
import { PublicListingCard } from "@/components/listings/public-listing-card";

const listing = {
  name: "Habit Tracker Pro",
  slug: "habit-tracker-pro",
  platforms: ["Web"],
  urls: { web: "https://example.com" },
  website_url: "https://example.com",
  description: "",
};

describe("PublicListingCard excerpt", () => {
  it("cleans noisy sections before excerpting", () => {
    render(
      <PublicListingCard
        listing={{
          ...listing,
          description: "Main Features\n- Fast setup\n- Daily reminders\n\nBuild streaks fast. Keep momentum going.",
        }}
        compact
      />,
    );

    expect(
      screen.getByText((_, element) => element?.textContent === "Build streaks fast. Keep momentum going."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Main Features/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Fast setup/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Daily reminders/)).not.toBeInTheDocument();
    expect(screen.queryByText("Keep momentum going.")).not.toBeInTheDocument();
  });

  it("keeps short text intact", () => {
    render(<PublicListingCard listing={{ ...listing, description: "Build streaks fast." }} compact />);

    expect(screen.getByText("Build streaks fast.")).toBeInTheDocument();
  });

  it("truncates long compact excerpts", () => {
    const longText = `${"Build streaks fast with daily reminders and quick check-ins, simple progress notes, weekly planning, and gentle nudges that keep momentum going without raw dumps or noisy bullets in compact cards ".repeat(3)}.`;

    const { container } = render(<PublicListingCard listing={{ ...listing, description: longText }} compact />);

    expect(container.querySelector("p")?.textContent?.endsWith("…")).toBe(true);
    expect(screen.queryByText(longText)).not.toBeInTheDocument();
  });

  it("uses the same cleaned excerpt in expanded cards", () => {
    render(
      <PublicListingCard
        listing={{
          ...listing,
          description: "Main Features\n- Fast setup\n\nBuild streaks fast. Keep momentum going.",
        }}
      />,
    );

    expect(
      screen.getByText((_, element) => element?.textContent === "Build streaks fast. Keep momentum going."),
    ).toBeInTheDocument();
  });
});
