import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";

const geistSansMock = vi.hoisted(() => vi.fn(() => ({ variable: "geist-sans" })));
const geistMonoMock = vi.hoisted(() => vi.fn(() => ({ variable: "geist-mono" })));
const appShellMock = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => <div data-testid="app-shell">{children}</div>),
);
const themeProviderMock = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  )),
);
const scriptMock = vi.hoisted(() =>
  vi.fn(({ id, strategy, children }: { id?: string; strategy?: string; children?: ReactNode }) => (
    <script data-testid="script" data-id={id} data-strategy={strategy}>
      {children as ReactNode}
    </script>
  )),
);

vi.mock("next/font/google", () => ({ Geist: geistSansMock, Geist_Mono: geistMonoMock }));
vi.mock("next/script", () => ({ default: scriptMock }));
vi.mock("@/components/app-shell", () => ({ AppShell: appShellMock }));
vi.mock("@/components/theme-provider", () => ({ ThemeProvider: themeProviderMock }));
vi.mock("@/lib/site-path", () => ({ withBasePath: (path: string) => `/base${path}` }));
vi.mock("@/app/globals.css", () => ({}));

import RootLayout, { metadata } from "@/app/layout";
import { render, screen } from "@/tests/utils/render";

describe("RootLayout", () => {
  beforeEach(() => {
    geistSansMock.mockClear();
    geistMonoMock.mockClear();
    appShellMock.mockClear();
    themeProviderMock.mockClear();
    scriptMock.mockClear();
  });

  it("exposes metadata and wraps children in shell providers", () => {
    expect(metadata.title).toEqual({
      default: "Habit Tracker Tracker",
      template: "%s | Habit Tracker Tracker",
    });
    expect(metadata.description).toContain("Supabase auth");
    expect(metadata.icons).toEqual({ icon: "/base/logo.png", apple: "/base/logo.png" });

    render(<RootLayout>content</RootLayout>);

    expect(screen.getByText("content")).toBeInTheDocument();
    expect(appShellMock).toHaveBeenCalled();
    expect(themeProviderMock).toHaveBeenCalled();
    expect(scriptMock.mock.calls[0][0]).toMatchObject({
      id: "theme-script",
      strategy: "beforeInteractive",
    });
    expect(typeof scriptMock.mock.calls[0][0].children).toBe("string");
  });
});
