import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

type ErrorStateProps = {
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
};

const errorStateMock = vi.hoisted(() =>
  vi.fn(({ title, description, retryLabel, onRetry }: ErrorStateProps) => (
    <button
      data-title={title}
      data-description={description}
      data-retry={retryLabel}
      onClick={onRetry}
    >
      retry
    </button>
  )),
);

vi.mock("@/components/ui/error-state", () => ({ ErrorState: errorStateMock }));

import ErrorPage from "@/app/error";
import { render, screen } from "@/tests/utils/render";

describe("ErrorPage", () => {
  it("falls back to unexpected error text and wires reset", async () => {
    const reset = vi.fn();
    const user = userEvent.setup();

    render(<ErrorPage error={{ message: "" } as Error} reset={reset} />);

    expect(screen.getByRole("button", { name: "retry" })).toHaveAttribute("data-description", "Unexpected error.");
    await user.click(screen.getByRole("button", { name: "retry" }));
    expect(reset).toHaveBeenCalled();
  });
});
