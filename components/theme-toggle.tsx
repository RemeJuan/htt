"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      <span aria-hidden="true">{resolvedTheme === "dark" ? "☀" : "☾"}</span>
      <span>{resolvedTheme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
