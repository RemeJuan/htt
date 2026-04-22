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

const buildListing = (overrides: Partial<ListingRow> = {}) =>
  ({
    name: "Habit Tracker Pro",
    slug: "habit-tracker-pro",
    platform: "Web",
    url: "https://example.com",
    description: "Track habits fast.",
    status: "published",
    is_claimed: false,
    ...overrides,
  }) as ListingRow;

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
    expect(screen.getByLabelText("Slug")).toBeRequired();
    expect(screen.getByLabelText("Slug")).toHaveAttribute("pattern", "[a-z0-9]+(?:-[a-z0-9]+)*");
    expect(screen.getByLabelText("Platform")).toBeRequired();
    expect(screen.getByLabelText("URL")).toBeRequired();
    expect(screen.getByLabelText("Status")).toHaveDisplayValue("draft");
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
    expect(screen.getByRole("textbox", { name: /Platform/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("combobox", { name: /Status/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("textbox", { name: /URL/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("textbox", { name: /Description/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("checkbox", { name: /Claimed listing/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Create listing" })).toHaveFocus();
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
    expect(screen.getByRole("textbox", { name: /Platform/i })).toHaveDisplayValue("Web");
    expect(screen.getByRole("textbox", { name: /URL/i })).toHaveDisplayValue("https://example.com");
    expect(screen.getByRole("textbox", { name: /Description/i })).toHaveDisplayValue(
      "Track habits fast.",
    );
    expect(screen.getByRole("combobox", { name: /Status/i })).toHaveDisplayValue("published");
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
    expect(screen.getByRole("combobox", { name: /Status/i })).toHaveDisplayValue("draft");
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
        url: "Enter a valid URL.",
      },
      message: "Fix the highlighted fields.",
    };

    render(<ListingForm action={vi.fn()} listing={buildListing()} submitLabel="Save listing" />);

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
    await user.type(screen.getByRole("textbox", { name: /Slug/i }), "habit-tracker");
    await user.type(screen.getByRole("textbox", { name: /Platform/i }), "Web");
    await user.type(screen.getByRole("textbox", { name: /URL/i }), "https://example.com");

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
    await user.type(screen.getByRole("textbox", { name: /Slug/i }), "habit-tracker");
    await user.type(screen.getByRole("textbox", { name: /Platform/i }), "Web");
    await user.type(screen.getByRole("textbox", { name: /URL/i }), "https://example.com");

    const form = screen.getByRole("button", { name: "Create listing" }).closest("form");
    expect(form).not.toBeNull();
    await lastFormAction?.(new FormData(form as HTMLFormElement));

    expect(action).toHaveBeenCalledTimes(1);
    expect((action.mock.calls[0]?.[1] as FormData).get("name")).toBe("  Habit Tracker  ");
  });
});
