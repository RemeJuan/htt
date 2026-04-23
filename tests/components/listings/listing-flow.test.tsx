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

type TestListing = ListingRow & { website_url?: string | null };

const buildListing = (overrides: Partial<TestListing> = {}) =>
  ({
    id: "listing-1",
    name: "Habit Tracker Pro",
    slug: "habit-tracker-pro",
    platforms: ["Web"],
    urls: { web: "https://example.com" },
    website_url: "https://company.example",
    description: "Track habits fast.",
    status: "draft",
    is_claimed: false,
    ...overrides,
  }) as TestListing;

function listingFromFormData(formData: FormData): TestListing {
  const platforms: string[] = [];
  const urls: Record<string, string> = {};

  formData.getAll("platforms").forEach((p) => {
    const platform = String(p);
    platforms.push(platform);
    const urlKey = `url_${platform.toLowerCase()}`;
    const urlValue = String(formData.get(urlKey) ?? "");
    if (urlValue) {
      urls[platform.toLowerCase()] = urlValue;
    }
  });

  return {
    ...buildListing(),
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    platforms,
    urls,
    website_url: String(formData.get("website_url") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
    status: String(formData.get("status") ?? "draft").toLowerCase() as ListingRow["status"],
    is_claimed: formData.get("is_claimed") !== null,
  };
}

function ListingSurface({ listings }: { listings: TestListing[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Saved listings</h2>
      <ul aria-label="Saved listings" className="space-y-2">
        {listings.map((listing) => (
          <li key={listing.id} className="rounded-xl border border-border px-4 py-3">
            <p className="font-medium">{listing.name}</p>
            <p className="text-sm text-muted-foreground">
              {listing.slug} · {listing.status === "published" ? "Published" : "Draft"} ·{" "}
              {listing.platforms?.join(", ") ?? "No platforms"}
            </p>
            <p className="text-xs text-muted-foreground">{listing.website_url ?? "No website"}</p>
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
  initialListings: TestListing[];
  mode: "create" | "edit";
}) {
  const [listings, setListings] = useState(initialListings);
  const currentListing = mode === "edit" ? listings[0] : undefined;

  const action = async (_state: ListingActionState, formData: FormData) => {
    const nextListing = listingFromFormData(formData);

    setListings((current) => {
      if (mode === "edit" && current.length > 0) {
        return current.map((listing) =>
          listing.id === currentListing?.id ? { ...listing, ...nextListing } : listing,
        );
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
      <ListingForm
        action={action}
        listing={currentListing}
        submitLabel={mode === "edit" ? "Save listing" : "Create listing"}
      />
    </div>
  );
}

function ListingFailureHarness() {
  const [listings] = useState([buildListing()]);
  const action = vi.fn(async () => ({
    errors: {
      slug: "Slug already taken.",
      website_url: "Invalid website URL.",
      Web: "Invalid URL for Web",
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
    expect((screen.getByRole("textbox", { name: /Slug/i }) as HTMLInputElement).value).toMatch(
      /^habit-tracker-pro-[a-z0-9]{5}$/,
    );
    await user.click(screen.getByRole("button", { name: /Platforms/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Web" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "iOS" }));
    await user.type(screen.getByLabelText("Website URL"), "https://company.example");
    await user.type(screen.getByRole("textbox", { name: /Web URL/i }), "https://example.com");
    await user.type(screen.getByRole("textbox", { name: /iOS URL/i }), "https://ios.example");
    await user.type(screen.getByRole("textbox", { name: /Description/i }), "Track habits fast.");

    await user.click(screen.getByRole("button", { name: "Create listing" }));

    expect(await screen.findByText("Listing created.")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent(
      "Habit Tracker Pro",
    );
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent("Draft");
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent("Web, iOS");
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent(
      "https://company.example",
    );
  });

  it("loads an existing listing, publishes it, and updates the surface", async () => {
    const user = userEvent.setup();

    render(<ListingFlowHarness initialListings={[buildListing()]} mode="edit" />);

    expect(screen.getByRole("textbox", { name: /^Name$/ })).toHaveDisplayValue("Habit Tracker Pro");
    expect(screen.getByRole("combobox", { name: /Status/i })).toHaveDisplayValue("Draft");
    expect(screen.getByLabelText("Website URL")).toHaveDisplayValue("https://company.example");

    await user.clear(screen.getByRole("textbox", { name: /^Name$/ }));
    await user.type(screen.getByRole("textbox", { name: /^Name$/ }), "Habit Tracker Pro Plus");
    await user.selectOptions(screen.getByRole("combobox", { name: /Status/i }), "Published");
    await user.clear(screen.getByLabelText("Website URL"));
    await user.type(screen.getByLabelText("Website URL"), "https://new.example");

    await user.click(screen.getByRole("button", { name: "Save listing" }));

    expect(await screen.findByText("Listing updated.")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent(
      "Habit Tracker Pro Plus",
    );
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent("Published");
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent("Web");
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent(
      "https://new.example",
    );
  });

  it("shows safe errors and leaves the list unchanged on failed save", async () => {
    mockActionState = {
      errors: {
        slug: "Slug already taken.",
        website_url: "Invalid website URL.",
        Web: "Invalid URL for Web",
      },
      message: "Fix the highlighted fields.",
    };
    render(<ListingFailureHarness />);

    expect(await screen.findByText("Fix the highlighted fields.")).toBeInTheDocument();
    expect(screen.getByText("Slug already taken.")).toBeInTheDocument();
    expect(screen.getByText("Invalid website URL.")).toBeInTheDocument();
    expect(screen.getByText("Invalid URL for Web")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /saved listings/i })).toHaveTextContent(
      "Habit Tracker Pro",
    );
  });
});
