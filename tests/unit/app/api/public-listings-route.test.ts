// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublishedListingsPageMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/public-listings", () => ({
  PUBLIC_LISTINGS_PAGE_SIZE: 20,
  getPublishedListingsPage: getPublishedListingsPageMock,
}));

import { GET } from "@/app/api/public-listings/route";

beforeEach(() => {
  getPublishedListingsPageMock.mockReset();
});

describe("GET /api/public-listings", () => {
  it("returns paginated listings", async () => {
    getPublishedListingsPageMock.mockResolvedValueOnce({
      items: [
        {
          name: "One",
          slug: "one",
          platforms: ["Web"],
          urls: { web: "https://one.test" },
          website_url: null,
          description: null,
        },
      ],
      hasMore: true,
      nextCursor: "cursor-1",
    });

    const response = await GET(
      new NextRequest("http://localhost:3000/api/public-listings?cursor=cursor-0&q=streak"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [
        {
          name: "One",
          slug: "one",
          platforms: ["Web"],
          urls: { web: "https://one.test" },
          website_url: null,
          description: null,
        },
      ],
      hasMore: true,
      nextCursor: "cursor-1",
    });
    expect(getPublishedListingsPageMock).toHaveBeenCalledWith({
      cursor: "cursor-0",
      limit: 20,
      search: "streak",
    });
  });

  it("returns 400 for invalid cursors", async () => {
    getPublishedListingsPageMock.mockRejectedValueOnce(
      new Error("Invalid public listings cursor."),
    );

    const response = await GET(
      new NextRequest("http://localhost:3000/api/public-listings?cursor=bad"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "Invalid public listings cursor." });
  });

  it("returns 500 for backend failures", async () => {
    getPublishedListingsPageMock.mockRejectedValueOnce(
      new Error("Failed to fetch published listings."),
    );

    const response = await GET(new NextRequest("http://localhost:3000/api/public-listings"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Failed to fetch published listings.",
    });
  });
});
