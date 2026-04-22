import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "@/tests/utils/render";

const getUserMock = vi.hoisted(() => vi.fn());
const onAuthStateChangeMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());
const replaceMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());
const hasEnvMock = vi.hoisted(() => vi.fn(() => true));

vi.mock("@/components/logo", () => ({ Logo: () => <div data-testid="logo" /> }));
vi.mock("@/components/theme-toggle", () => ({ ThemeToggle: () => <div data-testid="theme-toggle" /> }));
vi.mock("@/components/logout-button", () => ({ LogoutButton: () => <button>Logout</button> }));
vi.mock("@/lib/env", () => ({
  get hasSupabaseEnv() {
    return hasEnvMock();
  },
}));
vi.mock("@/lib/supabase", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getUser: getUserMock, onAuthStateChange: onAuthStateChangeMock, signOut: signOutMock },
  }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: replaceMock, refresh: refreshMock }) }));

import { Navbar } from "@/components/navbar";

describe("Navbar and LogoutButton", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    onAuthStateChangeMock.mockReset();
    signOutMock.mockReset();
    replaceMock.mockReset();
    refreshMock.mockReset();
    hasEnvMock.mockReturnValue(true);
  });

  it("shows logged-out links and unsubscribes", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    onAuthStateChangeMock.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

    const { unmount } = render(<Navbar />);

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup");
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();

    unmount();

    expect(onAuthStateChangeMock).toHaveBeenCalled();
  });

  it("shows logout for signed-in user", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    onAuthStateChangeMock.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

    render(<Navbar />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign up" })).not.toBeInTheDocument();
  });

  it("skips auth lookup when env missing", () => {
    hasEnvMock.mockReturnValue(false);

    render(<Navbar />);

    expect(getUserMock).not.toHaveBeenCalled();
    expect(onAuthStateChangeMock).not.toHaveBeenCalled();
  });
});
