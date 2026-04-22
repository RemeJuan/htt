import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

import type { ListingRow } from "@/lib/database.types";
import { render, screen, userEvent } from "@/tests/utils/render";

const useActionStateMock = vi.hoisted(() => vi.fn());

let mockActionState: ListingActionState = { errors: {} };
let mockPending = false;

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useActionState: (action, initialState) => {
      useActionStateMock(action, initialState);

      const [state, setState] = actual.useState(mockActionState ?? initialState);
      const [pending, setPending] = actual.useState(mockPending);

      const formAction = async (formData: FormData) => {
        if (pending) return state;

        setPending(true);

        try {
          const nextState = await action(state, formData);
          setState(nextState);
          return nextState;
        } finally {
          setPending(false);
        }
      };

      return [state, formAction, pending] as const;
    },
  };
});

import { ListingForm, type ListingActionState } from "@/components/listings/listing-form";

const buildListing = (overrides: Partial<ListingRow> = {}) =>
  ({
    id: "listing-1",
    name: "Habit Tracker Pro",
    slug: "habit-tracker-pro",
    platform: "Web",
    url: "https://example.com",
    description: "Track habits fast.",
    status: "draft",
    is_claimed: false,
    ...overrides,
  }) as ListingRow;

function listingFromFormData(formData: FormData): ListingRow {
  return {
    ...buildListing(),
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    platform: String(formData.get("platform") ?? ""),
    url: String(formData.get("url") ?? ""),
    description: String(formData.get("description") ?? "") || null,
    status: String(formData.get("status") ?? "draft") as ListingRow["status"],
    is_claimed: formData.get("is_claimed") !== null,
  };
}

function ListingSurface({ listings }: { listings: ListingRow[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Saved listings</h2>
      <ul aria-label="Saved listings" className="space-y-2">
        {listings.map((listing) => (
          <li key={listing.id} className="rounded-xl border border-border px-4 py-3">
            <p className="font-medium">{listing.name}</p>
            <p className="text-sm text-muted-foreground">
              {listing.slug} · {listing.status}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ListingFlowHarness({
  initialListings,
  mode,
}: {
  initialListings: ListingRow[];
  mode: "create" | "edit";
}) {
  const [listings, setListings] = useState(initialListings);
  const currentListing = mode === "edit" ? listings[0] : undefined;

  const action = async (_state: ListingActionState, formData: FormData) => {
    const nextListing = listingFromFormData(formData);

    setListings((current) => {
      if (mode === "edit" && current.length > 0) {
        return current.map((listing) => (listing.id === currentListing?.id ? { ...listing, ...nextListing } : listing));
      }

      return [
        ...current,
        {
          ...nextListing,
          id: `listing-${current.length + 1}`,
        },
      ];
    });

    return {
      errors: {},
      message: mode === "edit" ? "Listing updated." : "Listing created.",
    };
  };

  return (
    <div className="space-y-6">
      <ListingSurface listings={listings} />
      <ListingForm action={action} listing={currentListing} submitLabel={mode === "edit" ? "Save listing" : "Create listing"} />
    </div>
  );
}

function ListingFailureHarness() {
  const [listings] = useState([buildListing()]);
  const action = vi.fn(async () => ({
    errors: {
      slug: "Slug already taken.",
      url: "Enter a valid URL.",
    },
    message: "Fix the highlighted fields.",
  }));

  return (
    <div className="space-y-6">
      <ListingSurface listings={listings} />
      <ListingForm action={action} listing={buildListing()} submitLabel="Save listing" />
    </div>
  );
}

describe("Listing flows", () => {
  beforeEach(() => {
    useActionStateMock.mockReset();
    mockActionState = { errors: {} };
    mockPending = false;
  });

  it("creates a listing and refreshes the surface", async () => {
    const user = userEvent.setup();

    render(<ListingFlowHarness initialListings={[]} mode="create" />);

    await user.type(screen.getByRole("textbox", { name: /^Name$/ }), "Habit Tracker Pro");
    await user.type(screen.getByRole("textbox", { name: /Slug/i }), "habit-tracker-pro");
    await user.type(screen.getByRole("textbox", { name: /Platform/i }), "Web");
    await user.type(screen.getByRole("textbox", { name: /URL/i }), "https://example.com");
    await user.type(screen.getByRole("textbox", { name: /Description/i }), "Track habits fast.");

    await user.click(screen.getByRole("button", { name: "Create listing" }));

    expect(await screen.findByText("Listing created.")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent("Habit Tracker Pro");
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent("draft");
  });

  it("loads an existing listing, publishes it, and updates the surface", async () => {
    const user = userEvent.setup();

    render(<ListingFlowHarness initialListings={[buildListing()]} mode="edit" />);

    expect(screen.getByRole("textbox", { name: /^Name$/ })).toHaveDisplayValue("Habit Tracker Pro");
    expect(screen.getByRole("combobox", { name: /Status/i })).toHaveDisplayValue("draft");

    await user.clear(screen.getByRole("textbox", { name: /^Name$/ }));
    await user.type(screen.getByRole("textbox", { name: /^Name$/ }), "Habit Tracker Pro Plus");
    await user.selectOptions(screen.getByRole("combobox", { name: /Status/i }), "published");

    await user.click(screen.getByRole("button", { name: "Save listing" }));

    expect(await screen.findByText("Listing updated.")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent("Habit Tracker Pro Plus");
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent("published");
  });

  it("shows safe errors and leaves the list unchanged on failed save", async () => {
    const user = userEvent.setup();
    render(<ListingFailureHarness />);

    await user.clear(screen.getByRole("textbox", { name: /^Name$/ }));
    await user.type(screen.getByRole("textbox", { name: /^Name$/ }), "Broken listing");
    await user.click(screen.getByRole("button", { name: "Save listing" }));

    expect(await screen.findByText("Fix the highlighted fields.")).toBeInTheDocument();
    expect(screen.getByText("Slug already taken.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid URL.")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent("Habit Tracker Pro");
  });
});
