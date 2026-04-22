import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import * as React from "react";

import { render, screen } from "@/tests/utils/render";

const matchMediaMock = vi.hoisted(() => vi.fn());

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof React>("react");

  return {
    ...actual,
    useSyncExternalStore: vi.fn(),
  };
});

import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

function mockMatchMedia(matches = false) {
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();

  matchMediaMock.mockReturnValue({
    matches,
    addEventListener,
    removeEventListener,
  });

  return { addEventListener, removeEventListener };
}

describe("theme provider and toggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "";
    document.documentElement.dataset.themeMode = "";
    document.documentElement.style.colorScheme = "";
    vi.mocked(React.useSyncExternalStore).mockReturnValue(true);
    window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;
    mockMatchMedia(false);
  });

  it("falls back to system theme and cleans up listener", () => {
    const { addEventListener, removeEventListener } = mockMatchMedia(true);

    const { unmount } = render(
      <ThemeProvider>
        <div>child</div>
      </ThemeProvider>,
    );

    expect(document.documentElement.dataset.themeMode).toBe("system");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("applies stored dark mode and persists toggle changes", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("habit-tracker-theme", "dark");

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "Switch to light mode" })).toHaveTextContent(
      "☀",
    );

    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));

    expect(window.localStorage.getItem("habit-tracker-theme")).toBe("light");
    expect(document.documentElement.dataset.themeMode).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("shows fallback toggle copy before mount", () => {
    vi.mocked(React.useSyncExternalStore).mockReturnValue(false);

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "Toggle theme" })).toHaveTextContent("◐");
    expect(screen.getByRole("button", { name: "Toggle theme" })).toHaveTextContent("Theme");
  });

  it("throws outside provider", () => {
    function Probe() {
      useTheme();
      return null;
    }

    expect(() => render(<Probe />)).toThrow("useTheme must be used within ThemeProvider.");
  });
});
