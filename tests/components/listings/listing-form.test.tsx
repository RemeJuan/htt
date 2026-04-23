import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import type { ListingRow } from "@/lib/database.types";
import { render, screen } from "@/tests/utils/render";

const useActionStateMock = vi.hoisted(() => vi.fn());

let mockActionState: ListingActionState = { errors: {} };
let mockPending = false;
let lastFormAction:
  | ((formData: FormData) => Promise<ListingActionState> | ListingActionState)
  | null = null;

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useActionState: (action, initialState) => {
      useActionStateMock(action, initialState);

      const formAction = async (formData: FormData) => {
        if (mockPending) {
          return mockActionState;
        }

        mockPending = true;

        try {
          const nextState = await action(mockActionState ?? initialState, formData);
          mockActionState = nextState;
          return nextState;
        } finally {
          mockPending = false;
        }
      };

      lastFormAction = formAction;

      return [mockActionState ?? initialState, formAction, mockPending] as const;
    },
  };
});

import { ListingForm, type ListingActionState } from "@/components/listings/listing-form";

type TestListing = ListingRow & { website_url?: string | null };

const buildListing = (overrides: Partial<TestListing> = {}) =>
  ({
    name: "Habit Tracker Pro",
    slug: "habit-tracker-pro",
    platforms: ["Web"],
    urls: { web: "https://example.com" },
    website_url: "https://company.example",
    description: "Track habits fast.",
    status: "Published",
    is_claimed: false,
    ...overrides,
  }) as TestListing;

describe("ListingForm", () => {
  beforeEach(() => {
    useActionStateMock.mockReset();
    mockActionState = { errors: {} };
    mockPending = false;
    lastFormAction = null;
  });

  it("renders create defaults and required fields", () => {
    render(<ListingForm action={vi.fn()} submitLabel="Create listing" />);

    expect(screen.getByLabelText("Name")).toBeRequired();
    expect(screen.getByLabelText("Slug")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Slug")).not.toBeRequired();
    expect(screen.getByLabelText("Slug")).toHaveAttribute("pattern", "[a-z0-9]+(?:-[a-z0-9]+)*");
    expect(screen.getByRole("button", { name: /Platforms/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Website URL")).not.toBeRequired();
    expect(screen.queryByRole("textbox", { name: /Web URL/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toHaveDisplayValue("Draft");
    expect(screen.getByLabelText("Claimed listing")).toBeChecked();
    expect(screen.getByRole("button", { name: "Create listing" })).toBeEnabled();
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(<ListingForm action={vi.fn()} submitLabel="Create listing" />);

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });

  it("keeps form controls keyboard focusable in a sane order", async () => {
    const user = userEvent.setup();

    render(<ListingForm action={vi.fn()} submitLabel="Create listing" />);

    await user.tab();
    expect(screen.getByRole("textbox", { name: /^Name$/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("textbox", { name: /Slug/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: /Platforms/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("combobox", { name: /Status/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("textbox", { name: /Website URL/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("textbox", { name: /Description/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("checkbox", { name: /Claimed listing/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Create listing" })).toHaveFocus();
  });

  it("shows platform urls only for selected platforms", async () => {
    const user = userEvent.setup();

    render(<ListingForm action={vi.fn()} submitLabel="Create listing" />);

    await user.click(screen.getByRole("button", { name: /Platforms/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Web" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "iOS" }));

    expect(screen.getByRole("textbox", { name: /Web URL/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /iOS URL/i })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /Android URL/i })).not.toBeInTheDocument();
  });

  it("blocks submit when required fields are empty", async () => {
    const action = vi.fn().mockResolvedValue({ errors: {} });
    const user = userEvent.setup();

    render(<ListingForm action={action} submitLabel="Create listing" />);

    await user.click(screen.getByRole("button", { name: "Create listing" }));

    expect(action).not.toHaveBeenCalled();
  });

  it("prefills edit values from listing prop", () => {
    render(<ListingForm action={vi.fn()} listing={buildListing()} submitLabel="Save listing" />);

    expect(screen.getByRole("textbox", { name: /^Name$/ })).toHaveDisplayValue("Habit Tracker Pro");
    expect(screen.getByRole("textbox", { name: /Slug/i })).toHaveDisplayValue("habit-tracker-pro");
    expect(screen.getByRole("textbox", { name: /Slug/i })).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: /Platforms/i })).toHaveTextContent("Web");
    expect(screen.getByLabelText("Website URL")).toHaveDisplayValue("https://company.example");
    expect(screen.getByRole("textbox", { name: /Web URL/i })).toHaveDisplayValue(
      "https://example.com",
    );
    expect(screen.getByRole("textbox", { name: /Description/i })).toHaveDisplayValue(
      "Track habits fast.",
    );
    expect(screen.getByRole("combobox", { name: /Status/i })).toHaveDisplayValue("Published");
    expect(screen.getByRole("checkbox", { name: /Claimed listing/i })).not.toBeChecked();
  });

  it("renders malformed listing values without crashing", () => {
    render(
      <ListingForm
        action={vi.fn()}
        listing={buildListing({ slug: "Bad Slug", status: "not-a-status" as ListingRow["status"] })}
        submitLabel="Save listing"
      />,
    );

    expect(screen.getByRole("textbox", { name: /Slug/i })).toHaveDisplayValue("Bad Slug");
    expect(screen.getByRole("combobox", { name: /Status/i })).toHaveDisplayValue("Draft");
  });

  it("disables submit and shows pending text", () => {
    mockPending = true;

    render(<ListingForm action={vi.fn()} submitLabel="Save listing" />);

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saving..." })).toHaveTextContent("Saving...");
  });

  it("shows submit failure message and field errors", () => {
    mockActionState = {
      errors: {
        slug: "Slug already taken.",
        website_url: "Invalid website URL.",
        Web: "Invalid URL for Web",
      },
      message: "Fix the highlighted fields.",
    };

    render(<ListingForm action={vi.fn()} listing={buildListing()} submitLabel="Save listing" />);

    expect(screen.getByText((text) => text.includes("Fix the highlighted"))).toBeInTheDocument();
    expect(screen.getByText("Slug already taken.")).toBeInTheDocument();
    expect(screen.getByText("Invalid website URL.")).toBeInTheDocument();
    expect(screen.getByText("Invalid URL for Web")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^Name$/ })).toHaveDisplayValue("Habit Tracker Pro");
    expect(screen.getByRole("textbox", { name: /Slug/i })).toHaveDisplayValue("habit-tracker-pro");
    expect(screen.getByRole("button", { name: /Platforms/i })).toHaveTextContent("Web");
    expect(screen.getByLabelText("Website URL")).toHaveDisplayValue("https://company.example");
    expect(screen.getByRole("textbox", { name: /Web URL/i })).toHaveDisplayValue(
      "https://example.com",
    );
    expect(screen.getByRole("textbox", { name: /Description/i })).toHaveDisplayValue(
      "Track habits fast.",
    );
    expect(screen.getByRole("combobox", { name: /Status/i })).toHaveDisplayValue("Published");
    expect(screen.getByRole("checkbox", { name: /Claimed listing/i })).not.toBeChecked();
  });

  it("submits once for valid data and blocks rapid double submit", async () => {
    let resolveAction!: (value: ListingActionState) => void;
    const action = vi.fn(
      () =>
        new Promise<ListingActionState>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();

    render(<ListingForm action={action} submitLabel="Create listing" />);

    await user.type(screen.getByRole("textbox", { name: /^Name$/ }), "Habit Tracker");
    expect((screen.getByRole("textbox", { name: /Slug/i }) as HTMLInputElement).value).toMatch(
      /^habit-tracker-[a-z0-9]{5}$/,
    );
    await user.click(screen.getByRole("button", { name: /Platforms/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Web" }));
    await user.type(screen.getByLabelText("Website URL"), "https://company.example");
    await user.type(screen.getByRole("textbox", { name: /Web URL/i }), "https://example.com");

    const form = screen.getByRole("button", { name: "Create listing" }).closest("form");
    expect(form).not.toBeNull();
    const payload = new FormData(form as HTMLFormElement);

    const firstSubmit = lastFormAction?.(payload);
    const secondSubmit = lastFormAction?.(payload);

    expect(action).toHaveBeenCalledTimes(1);
    resolveAction({ errors: {} });
    await firstSubmit;
    await secondSubmit;
  });

  it("does not trim entered values before submit", async () => {
    const action = vi.fn().mockResolvedValue({ errors: {} });
    const user = userEvent.setup();

    render(<ListingForm action={action} submitLabel="Create listing" />);

    await user.type(screen.getByRole("textbox", { name: /^Name$/ }), "  Habit Tracker  ");
    expect((screen.getByRole("textbox", { name: /Slug/i }) as HTMLInputElement).value).toMatch(
      /^habit-tracker-[a-z0-9]{5}$/,
    );
    await user.click(screen.getByRole("button", { name: /Platforms/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Web" }));
    await user.type(screen.getByLabelText("Website URL"), "https://company.example");
    await user.type(screen.getByRole("textbox", { name: /Web URL/i }), "https://example.com");

    const form = screen.getByRole("button", { name: "Create listing" }).closest("form");
    expect(form).not.toBeNull();
    await lastFormAction?.(new FormData(form as HTMLFormElement));

    expect(action).toHaveBeenCalledTimes(1);
    expect((action.mock.calls[0]?.[1] as FormData).get("name")).toBe("  Habit Tracker  ");
    expect((action.mock.calls[0]?.[1] as FormData).get("slug")).toMatch(/^habit-tracker-/);
  });
});
