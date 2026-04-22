import { describe, expect, it, vi } from "vitest";

import { ErrorState } from "@/components/ui/error-state";
import { fireEvent, render, screen } from "@/tests/utils/render";

describe("ErrorState", () => {
  it("renders retry action when callback provided", async () => {
    const onRetry = vi.fn();

    render(
      <ErrorState
        title="Could not load trackers"
        description="Try again in a moment."
        retryLabel="Retry"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("heading", { name: "Could not load trackers" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
