import type { Database } from "@/lib/database.types";

export type PublicListing = Pick<
  Database["public"]["Tables"]["listings"]["Row"],
  "name" | "slug" | "platforms" | "urls" | "website_url" | "description"
>;

export type PublicListingsPage = {
  items: PublicListing[];
  nextCursor: string | null;
  hasMore: boolean;
};

const PUBLIC_LISTINGS_CACHE_KEY = "public-listings-cache:v1";

const memoryCachedPages = new Map<string, PublicListingsPage>();

function canRestoreCachedTail(initialPage: PublicListingsPage, cachedPage: PublicListingsPage) {
  if (cachedPage.items.length <= initialPage.items.length) {
    return true;
  }

  return initialPage.items.every(
    (listing, index) => cachedPage.items[index]?.slug === listing.slug,
  );
}

function isPublicListing(value: unknown): value is PublicListing {
  if (!value || typeof value !== "object") return false;

  const listing = value as Record<string, unknown>;
  const platforms = listing.platforms;
  const urls = listing.urls;
  const websiteUrl = listing.website_url;

  return (
    typeof listing.name === "string" &&
    listing.name.length > 0 &&
    typeof listing.slug === "string" &&
    listing.slug.length > 0 &&
    Array.isArray(platforms) &&
    platforms.length > 0 &&
    platforms.every((platform) => typeof platform === "string" && platform.length > 0) &&
    !!urls &&
    typeof urls === "object" &&
    !Array.isArray(urls) &&
    Object.keys(urls).length > 0 &&
    Object.entries(urls).every(
      ([platform, url]) =>
        typeof platform === "string" &&
        platform.length > 0 &&
        typeof url === "string" &&
        /^https?:\/\//.test(url),
    ) &&
    (websiteUrl === null || (typeof websiteUrl === "string" && /^https?:\/\//.test(websiteUrl))) &&
    (typeof listing.description === "string" || listing.description === null)
  );
}

function getStorage(storage?: Storage | null) {
  if (storage !== undefined) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function sanitizePublicListings(data: unknown): PublicListing[] {
  return Array.isArray(data) ? data.filter(isPublicListing) : [];
}

export function sanitizePublicListing(data: unknown): PublicListing | null {
  return isPublicListing(data) ? data : null;
}

export function sanitizePublicListingsPage(data: unknown): PublicListingsPage | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const page = data as Record<string, unknown>;
  const items = sanitizePublicListings(page.items);

  if (!Array.isArray(page.items) || items.length !== page.items.length) {
    return null;
  }

  if (typeof page.hasMore !== "boolean") {
    return null;
  }

  if (!(typeof page.nextCursor === "string" || page.nextCursor === null)) {
    return null;
  }

  return {
    items,
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
  };
}

export function mergePublicListingsPages(
  currentPage: PublicListingsPage,
  nextPage: PublicListingsPage,
): PublicListingsPage {
  const seen = new Set<string>();
  const items: PublicListing[] = [];

  for (const listing of [...currentPage.items, ...nextPage.items]) {
    if (seen.has(listing.slug)) {
      continue;
    }

    seen.add(listing.slug);
    items.push(listing);
  }

  return {
    items,
    hasMore: nextPage.hasMore,
    nextCursor: nextPage.nextCursor,
  };
}

export function readPublicListingsPageCache(
  storage?: Storage | null,
  cacheKey = PUBLIC_LISTINGS_CACHE_KEY,
): PublicListingsPage | null {
  const memoryCachedPage = memoryCachedPages.get(cacheKey);

  if (memoryCachedPage) {
    return memoryCachedPage;
  }

  const sessionStorage = getStorage(storage);
  if (!sessionStorage) {
    return null;
  }

  try {
    const cachedValue = sessionStorage.getItem(cacheKey);
    if (!cachedValue) {
      return null;
    }

    const parsed = sanitizePublicListingsPage(JSON.parse(cachedValue));
    if (!parsed) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }

    memoryCachedPages.set(cacheKey, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function writePublicListingsPageCache(
  page: PublicListingsPage,
  storage?: Storage | null,
  cacheKey = PUBLIC_LISTINGS_CACHE_KEY,
): PublicListingsPage {
  memoryCachedPages.set(cacheKey, page);

  const sessionStorage = getStorage(storage);
  if (!sessionStorage) {
    return page;
  }

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(page));
  } catch {
    return page;
  }

  return page;
}

export function clearPublicListingsPageCache(storage?: Storage | null, cacheKey?: string) {
  if (cacheKey) {
    memoryCachedPages.delete(cacheKey);
  } else {
    memoryCachedPages.clear();
  }

  const sessionStorage = getStorage(storage);
  if (!sessionStorage) {
    return;
  }

  try {
    if (cacheKey) {
      sessionStorage.removeItem(cacheKey);
      return;
    }

    sessionStorage.removeItem(PUBLIC_LISTINGS_CACHE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function resolvePublicListingsPageState(
  initialPage: PublicListingsPage,
  storage?: Storage | null,
  cacheKey = PUBLIC_LISTINGS_CACHE_KEY,
): PublicListingsPage {
  const cachedPage = readPublicListingsPageCache(storage, cacheKey);
  const resolvedPage =
    cachedPage && canRestoreCachedTail(initialPage, cachedPage)
      ? mergePublicListingsPages(initialPage, cachedPage)
      : initialPage;

  return writePublicListingsPageCache(resolvedPage, storage, cacheKey);
}
