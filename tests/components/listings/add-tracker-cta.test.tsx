import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen } from "@/tests/utils/render";

const pushMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
}));

import {
  AddTrackerCta,
  CREATE_TRACKER_ROUTE,
  LOGIN_TO_CREATE_TRACKER_ROUTE,
} from "@/components/listings/add-tracker-cta";

describe("AddTrackerCta", () => {
  beforeEach(() => {
    pushMock.mockReset();
    getUserMock.mockReset();
  });

  it("routes authenticated users to create tracker", async () => {
    const user = userEvent.setup();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    render(<AddTrackerCta />);

    await user.click(screen.getByRole("button", { name: "Add tracker" }));

    expect(pushMock).toHaveBeenCalledWith(CREATE_TRACKER_ROUTE);
  });

  it("routes anonymous users to login with next", async () => {
    const user = userEvent.setup();
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    render(<AddTrackerCta />);

    await user.click(screen.getByRole("button", { name: "Add tracker" }));

    expect(pushMock).toHaveBeenCalledWith(LOGIN_TO_CREATE_TRACKER_ROUTE);
  });
});
