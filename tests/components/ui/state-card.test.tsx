import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StateCard } from "@/components/ui/state-card";
import { fireEvent, render, screen } from "@/tests/utils/render";
import { axe } from "vitest-axe";

describe("StateCard", () => {
  it("renders title, description, and action content", () => {
    render(
      <StateCard
        icon={<span aria-hidden="true">★</span>}
        title="Need attention"
        description="Fix this before shipping."
        action={<a href="/docs">Learn more</a>}
      />,
    );

    expect(screen.getByRole("heading", { name: "Need attention" })).toBeInTheDocument();
    expect(screen.getByText("Fix this before shipping.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Learn more" })).toHaveAttribute("href", "/docs");
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(
      <StateCard
        icon={<span aria-hidden="true">★</span>}
        title="Need attention"
        description="Fix this before shipping."
        action={<a href="/docs">Learn more</a>}
      />,
    );

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });

  it("shows the default loading copy", () => {
    render(<LoadingState />);

    expect(screen.getByRole("heading", { name: "Loading" })).toBeInTheDocument();
    expect(screen.getByText("Fetching content.")).toBeInTheDocument();
  });

  it("passes empty-state content through", () => {
    render(
      <EmptyState
        title="Nothing here yet"
        description="Create your first listing to get started."
        action={<a href="/dashboard/listings/new">Add listing</a>}
      />,
    );

    expect(screen.getByRole("heading", { name: "Nothing here yet" })).toBeInTheDocument();
    expect(screen.getByText("Create your first listing to get started.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add listing" })).toHaveAttribute(
      "href",
      "/dashboard/listings/new",
    );
  });

  it("renders retry action only when wired", () => {
    const onRetry = vi.fn();

    render(
      <ErrorState
        title="Could not load listings"
        description="Try again in a moment."
        retryLabel="Retry"
        onRetry={onRetry}
      />,
    );

    const retryButton = screen.getByRole("button", { name: "Retry" });

    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("keeps retry action keyboard focusable", async () => {
    const user = userEvent.setup();

    render(
      <ErrorState
        title="Could not load listings"
        description="Try again in a moment."
        retryLabel="Retry"
        onRetry={vi.fn()}
      />,
    );

    await user.tab();

    expect(screen.getByRole("button", { name: "Retry" })).toHaveFocus();
  });

  it("has no obvious accessibility violations for error state", async () => {
    const { container } = render(
      <ErrorState
        title="Could not load listings"
        description="Try again in a moment."
        retryLabel="Retry"
        onRetry={vi.fn()}
      />,
    );

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });

  it("hides retry action when callback missing", () => {
    render(<ErrorState title="Could not load listings" description="Try again in a moment." />);

    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});
