"use client";

import { useSyncExternalStore } from "react";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";
  const label = mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme";
  const icon = mounted ? (isDark ? "☀" : "☾") : "◐";
  const text = mounted ? (isDark ? "Light" : "Dark") : "Theme";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
      aria-label={label}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{text}</span>
    </button>
  );
}
