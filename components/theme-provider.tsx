"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ThemeMode, ThemeResolved } from "@/types/theme";

const STORAGE_KEY = "habit-tracker-theme";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ThemeResolved;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedMode = window.localStorage.getItem(STORAGE_KEY);

  return storedMode === "light" || storedMode === "dark" ? storedMode : "system";
}

function getSystemTheme(): ThemeResolved {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(mode: ThemeMode): ThemeResolved {
  if (mode === "system") {
    return getSystemTheme();
  }

  return mode;
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const resolvedTheme = resolveTheme(mode);

  root.dataset.themeMode = mode;
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;

  return resolvedTheme;
}

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const [systemTheme, setSystemTheme] = useState<ThemeResolved>(getSystemTheme);

  const resolvedTheme = mode === "system" ? systemTheme : mode;

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    applyTheme(nextMode);

    if (nextMode === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, nextMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      setSystemTheme(getSystemTheme());
    };

    applyTheme(mode);

    if (mode !== "system") {
      return;
    }

    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, [mode, resolvedTheme]);

  const value = useMemo(
    () => ({ mode, resolvedTheme, toggleTheme, setMode }),
    [mode, resolvedTheme, toggleTheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
