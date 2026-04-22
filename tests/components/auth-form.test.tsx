import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen } from "@/tests/utils/render";

const replaceMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());
const signInMock = vi.hoisted(() => vi.fn());
const signUpMock = vi.hoisted(() => vi.fn());
const searchParamsMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
  useSearchParams: () => ({ get: searchParamsMock }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signInWithPassword: signInMock,
      signUp: signUpMock,
    },
  }),
}));

import { AuthForm } from "@/components/auth-form";

describe("AuthForm", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    refreshMock.mockReset();
    signInMock.mockReset();
    signUpMock.mockReset();
    searchParamsMock.mockReset();
    searchParamsMock.mockReturnValue(null);
  });

  it("preserves next on login and auth toggle link", async () => {
    const user = userEvent.setup();
    searchParamsMock.mockReturnValue("/dashboard/listings/new");
    signInMock.mockResolvedValue({ data: { session: { id: "s1" } }, error: null });

    render(<AuthForm mode="login" />);

    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/signup?next=%2Fdashboard%2Flistings%2Fnew",
    );

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(replaceMock).toHaveBeenCalledWith("/dashboard/listings/new");
  });

  it("uses next in signup email redirect", async () => {
    const user = userEvent.setup();
    searchParamsMock.mockReturnValue("/dashboard/listings/new");
    signUpMock.mockResolvedValue({ data: { session: null }, error: null });

    render(<AuthForm mode="signup" />);

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fdashboard%2Flistings%2Fnew",
    );

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: {
          emailRedirectTo: "http://localhost:3000/auth/callback?next=%2Fdashboard%2Flistings%2Fnew",
        },
      }),
    );
  });
});
