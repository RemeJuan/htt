import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen } from "@/tests/utils/render";

const getUserIdentitiesMock = vi.hoisted(() => vi.fn());
const linkIdentityMock = vi.hoisted(() => vi.fn());
const searchParamsMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: searchParamsMock }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUserIdentities: getUserIdentitiesMock,
      linkIdentity: linkIdentityMock,
    },
  }),
}));
vi.mock("@/lib/env", () => ({
  getAuthCallbackUrl: (next: string) => `https://example.com/auth/callback/?next=${encodeURIComponent(next)}`,
}));

import { AccountSettings } from "@/components/account-settings";

describe("AccountSettings", () => {
  beforeEach(() => {
    getUserIdentitiesMock.mockReset();
    linkIdentityMock.mockReset();
    searchParamsMock.mockReset();
    searchParamsMock.mockReturnValue(null);
  });

  it("shows github linked status", async () => {
    getUserIdentitiesMock.mockResolvedValue({ data: { identities: [{ provider: "github" }] }, error: null });

    render(<AccountSettings email="user@example.com" />);

    expect(await screen.findByText(/GitHub status: linked/i)).toBeInTheDocument();
  });

  it("links github with callback state", async () => {
    const user = userEvent.setup();
    getUserIdentitiesMock.mockResolvedValue({ data: { identities: [] }, error: null });
    linkIdentityMock.mockResolvedValue({ error: null });

    render(<AccountSettings email="user@example.com" />);

    await user.click(await screen.findByRole("button", { name: /connect github/i }));

    expect(linkIdentityMock).toHaveBeenCalledWith({
      provider: "github",
      options: {
        redirectTo: "https://example.com/auth/callback/?next=%2Fdashboard%2Faccount%3Flinked%3Dgithub",
      },
    });
  });

  it("shows github connected success state", async () => {
    getUserIdentitiesMock.mockResolvedValue({ data: { identities: [] }, error: null });
    searchParamsMock.mockReturnValue("github");

    render(<AccountSettings email="user@example.com" />);

    expect(await screen.findByText("GitHub connected.")).toBeInTheDocument();
  });
});
