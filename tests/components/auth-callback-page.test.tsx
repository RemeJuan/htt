import { beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";

import { render, screen, waitFor } from "@/tests/utils/render";

const replaceMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());
const exchangeCodeForSessionMock = vi.hoisted(() => vi.fn());
const hasEnvMock = vi.hoisted(() => vi.fn(() => true));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
}));
vi.mock("@/lib/env", () => ({
  get hasSupabaseEnv() {
    return hasEnvMock();
  },
}));
vi.mock("@/lib/supabase", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { exchangeCodeForSession: exchangeCodeForSessionMock },
  }),
}));

import AuthCallbackPage from "@/app/auth/callback/page";

function setLocation(search: string) {
  window.history.pushState({}, "", `/auth/callback/${search}`);
}

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    refreshMock.mockReset();
    exchangeCodeForSessionMock.mockReset();
    hasEnvMock.mockReturnValue(true);
    setLocation("");
  });

  it("shows missing code copy", async () => {
    render(<AuthCallbackPage />);

    await waitFor(() => expect(screen.getByText("Missing sign-in code.")).toBeInTheDocument());
    expect(screen.getByText("Open the login page and try again.")).toBeInTheDocument();
  });

  it("shows missing env copy", async () => {
    hasEnvMock.mockReturnValue(false);
    setLocation("?code=abc");

    render(<AuthCallbackPage />);

    await waitFor(() => expect(screen.getByText("Supabase env missing.")).toBeInTheDocument());
    expect(
      screen.getByText("Set the public Supabase env vars in your deployment environment."),
    ).toBeInTheDocument();
  });

  it("shows exchange failure", async () => {
    setLocation("?code=abc");
    exchangeCodeForSessionMock.mockResolvedValue({ error: { message: "bad code" } });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(screen.getByText("Sign in failed.")).toBeInTheDocument());
    expect(screen.getByText("bad code")).toBeInTheDocument();
  });

  it("redirects with safe next", async () => {
    setLocation("?code=abc&next=//evil.com");
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });

    render(<AuthCallbackPage />);

    await act(async () => {});

    expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    expect(refreshMock).toHaveBeenCalledOnce();
  });
});
