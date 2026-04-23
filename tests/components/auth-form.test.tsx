import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen } from "@/tests/utils/render";

const replaceMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());
const signInMock = vi.hoisted(() => vi.fn());
const signUpMock = vi.hoisted(() => vi.fn());
const signInWithOAuthMock = vi.hoisted(() => vi.fn());
const searchParamsMock = vi.hoisted(() => vi.fn());
const getAuthCallbackUrlMock = vi.hoisted(() => vi.fn());

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
  useSearchParams: () => ({ get: searchParamsMock }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signInWithPassword: signInMock,
      signUp: signUpMock,
      signInWithOAuth: signInWithOAuthMock,
    },
  }),
}));
vi.mock("@/lib/env", () => ({
  getAuthCallbackUrl: getAuthCallbackUrlMock,
}));

import { AuthForm } from "@/components/auth-form";

describe("AuthForm", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    refreshMock.mockReset();
    signInMock.mockReset();
    signUpMock.mockReset();
    signInWithOAuthMock.mockReset();
    searchParamsMock.mockReset();
    getAuthCallbackUrlMock.mockReset();
    searchParamsMock.mockReturnValue(null);
    getAuthCallbackUrlMock.mockImplementation(
      (next: string) => `https://example.com/auth/callback/?next=${encodeURIComponent(next)}`,
    );
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

    expect(signUpMock).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret123",
      options: {
        emailRedirectTo: "https://example.com/auth/callback/?next=%2Fdashboard%2Flistings%2Fnew",
      },
    });
  });

  it("shows signup success copy and disables double submit", async () => {
    const user = userEvent.setup();
    const pending = deferred({ data: { session: null }, error: null });
    signUpMock.mockReturnValue(pending.promise);

    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    await user.click(screen.getByRole("button", { name: /creating account/i }));

    expect(signUpMock).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled();

    pending.resolve({ data: { session: null }, error: null });

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(screen.getByText(/We sent a confirmation link to/)).toBeInTheDocument();
  });

  it("shows login errors inline", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ data: { session: null }, error: { message: "bad login" } });

    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("bad login")).toBeInTheDocument();
  });

  it("starts github oauth with next preserved", async () => {
    const user = userEvent.setup();
    searchParamsMock.mockReturnValue("/dashboard/account");
    signInWithOAuthMock.mockResolvedValue({ error: null });

    render(<AuthForm mode="login" />);

    await user.click(screen.getByRole("button", { name: /continue with github/i }));

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "github",
      options: {
        redirectTo: "https://example.com/auth/callback/?next=%2Fdashboard%2Faccount",
        queryParams: { next: "/dashboard/account" },
      },
    });
  });
});
