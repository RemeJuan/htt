import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen } from "@/tests/utils/render";

const signOutMock = vi.hoisted(() => vi.fn());
const replaceMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  getSupabaseBrowserClient: () => ({ auth: { signOut: signOutMock } }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: replaceMock, refresh: refreshMock }) }));

import { LogoutButton } from "@/components/logout-button";

describe("LogoutButton", () => {
  beforeEach(() => {
    signOutMock.mockReset();
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

  it("redirects after sign out", async () => {
    const user = userEvent.setup();
    signOutMock.mockResolvedValue({ error: null });

    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(signOutMock).toHaveBeenCalledOnce();
    expect(replaceMock).toHaveBeenCalledWith("/");
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("resets loading on error", async () => {
    const user = userEvent.setup();
    signOutMock.mockRejectedValue(new Error("nope"));

    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(screen.getByRole("button", { name: "Logout" })).toBeEnabled();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
