import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ListingRow } from "@/lib/database.types";
import { render, screen } from "@/tests/utils/render";

const useActionStateMock = vi.hoisted(() => vi.fn());

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useActionState: useActionStateMock,
  };
});

import { ListingForm } from "@/components/listings/listing-form";

describe("ListingForm", () => {
  beforeEach(() => {
    useActionStateMock.mockReturnValue([{ errors: {} }, vi.fn(), false]);
  });

  it("renders create defaults and required fields", () => {
    render(<ListingForm action={vi.fn()} submitLabel="Create listing" />);

    expect(screen.getByLabelText("Name")).toBeRequired();
    expect(screen.getByLabelText("Slug")).toBeRequired();
    expect(screen.getByLabelText("Slug")).toHaveAttribute("pattern", "[a-z0-9]+(?:-[a-z0-9]+)*");
    expect(screen.getByLabelText("Platform")).toBeRequired();
    expect(screen.getByLabelText("URL")).toBeRequired();
    expect(screen.getByLabelText("Status")).toHaveDisplayValue("draft");
    expect(screen.getByLabelText("Claimed listing")).toBeChecked();
    expect(screen.getByRole("button", { name: "Create listing" })).toBeEnabled();
  });

  it("shows submit failure message and field errors", () => {
    useActionStateMock.mockReturnValue([
      {
        errors: {
          slug: "Slug already taken.",
          url: "Enter a valid URL.",
        },
        message: "Fix the highlighted fields.",
      },
      vi.fn(),
      false,
    ]);

    const listing = {
      name: "Habit Tracker Pro",
      slug: "habit-tracker-pro",
      platform: "Web",
      url: "https://example.com",
      description: "Track habits fast.",
      status: "published",
      is_claimed: false,
    } as ListingRow;

    render(<ListingForm action={vi.fn()} listing={listing} submitLabel="Save listing" />);

    expect(screen.getByText("Fix the highlighted fields.")).toBeInTheDocument();
    expect(screen.getByText("Slug already taken.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid URL.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^Name$/ })).toHaveDisplayValue("Habit Tracker Pro");
    expect(screen.getByRole("textbox", { name: /Slug/i })).toHaveDisplayValue("habit-tracker-pro");
    expect(screen.getByRole("textbox", { name: /Platform/i })).toHaveDisplayValue("Web");
    expect(screen.getByRole("textbox", { name: /URL/i })).toHaveDisplayValue("https://example.com");
    expect(screen.getByRole("textbox", { name: /Description/i })).toHaveDisplayValue(
      "Track habits fast.",
    );
    expect(screen.getByRole("combobox", { name: /Status/i })).toHaveDisplayValue("published");
    expect(screen.getByRole("checkbox", { name: /Claimed listing/i })).not.toBeChecked();
  });
});
