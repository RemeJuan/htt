import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearPublicListingsPageCache } from "@/lib/public-listings-shared";
import { render, screen, waitFor } from "@/tests/utils/render";

const resolvePage = {
  items: [
    {
      name: "Alpha",
      slug: "alpha",
      platforms: ["Web"],
      urls: { web: "https://alpha.test" },
      website_url: null,
      description: null,
    },
  ],
  hasMore: true,
  nextCursor: "cursor-1",
};

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }
  trigger(isIntersecting = true) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver as never);
  vi.stubGlobal("fetch", vi.fn());
  clearPublicListingsPageCache();
  window.sessionStorage.clear();
});

describe("PublicListingsFeed", () => {
  it("renders first page and loads next page on sentinel intersect", async () => {
    const { PublicListingsFeed } = await import("@/components/listings/public-listings-feed");

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            name: "Alpha",
            slug: "alpha",
            platforms: ["Web"],
            urls: { web: "https://alpha.test" },
            website_url: null,
            description: null,
          },
          {
            name: "Beta",
            slug: "beta",
            platforms: ["Web"],
            urls: { web: "https://beta.test" },
            website_url: null,
            description: null,
          },
        ],
        hasMore: false,
        nextCursor: null,
      }),
    } as Response);

    render(<PublicListingsFeed initialPage={resolvePage} />);

    expect(screen.getByRole("heading", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByTestId("public-listings-sentinel")).toBeInTheDocument();

    await waitFor(() => expect(MockIntersectionObserver.instances).toHaveLength(1));

    act(() => {
      MockIntersectionObserver.instances[0]?.trigger();
    });

    await waitFor(() => expect(screen.getByRole("heading", { name: "Beta" })).toBeInTheDocument());
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
  });

  it("drops duplicate rows from overlapping pages", async () => {
    const { PublicListingsFeed } = await import("@/components/listings/public-listings-feed");

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [resolvePage.items[0], { ...resolvePage.items[0], slug: "gamma", name: "Gamma" }],
        hasMore: false,
        nextCursor: null,
      }),
    } as Response);

    render(<PublicListingsFeed initialPage={resolvePage} />);
    await waitFor(() => expect(MockIntersectionObserver.instances).toHaveLength(1));
    act(() => {
      MockIntersectionObserver.instances[0]?.trigger();
    });

    await waitFor(() => expect(screen.getByRole("heading", { name: "Gamma" })).toBeInTheDocument());
    expect(screen.getAllByRole("heading", { level: 3, name: /Alpha|Gamma/ })).toHaveLength(2);
  });

  it("shows end state when no more pages", async () => {
    const { PublicListingsFeed } = await import("@/components/listings/public-listings-feed");

    render(
      <PublicListingsFeed
        initialPage={{ ...resolvePage, hasMore: false, nextCursor: null }}
      />,
    );

    expect(screen.getByText("You’ve reached the end of the listings.")).toBeInTheDocument();
    expect(screen.queryByTestId("public-listings-sentinel")).not.toBeInTheDocument();
  });
});
