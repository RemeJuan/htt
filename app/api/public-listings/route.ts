import type { NextRequest } from "next/server";

import { PUBLIC_LISTINGS_PAGE_SIZE, getPublishedListingsPage } from "@/lib/public-listings";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cursor = request.nextUrl.searchParams.get("cursor");
    const search = request.nextUrl.searchParams.get("q") ?? undefined;
    const page = await getPublishedListingsPage({
      cursor,
      limit: PUBLIC_LISTINGS_PAGE_SIZE,
      search,
    });

    return Response.json(page);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch public listings.";
    const status = message === "Invalid public listings cursor." ? 400 : 500;

    return Response.json({ message }, { status });
  }
}
