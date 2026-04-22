export type ThemeMode = "light" | "dark" | "system";

export type ThemeResolved = Exclude<ThemeMode, "system">;
