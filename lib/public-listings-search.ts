export const PUBLIC_LISTINGS_QUERY_PARAM = "q";
export const PUBLIC_LISTINGS_PAGE_PARAM = "page";

type PublicListingsSearchParams = Record<string, string | string[] | undefined>;

export function normalizePublicListingsSearchQuery(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, 100);
}

function getSingleSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function readPublicListingsSearchParams(searchParams: PublicListingsSearchParams) {
  const query = normalizePublicListingsSearchQuery(
    getSingleSearchParamValue(searchParams[PUBLIC_LISTINGS_QUERY_PARAM]),
  );
  const rawPage = getSingleSearchParamValue(searchParams[PUBLIC_LISTINGS_PAGE_PARAM]);
  const page = Number.parseInt(rawPage ?? "1", 10);

  return {
    query,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function buildPublicListingsSearchHref(
  pathname: string,
  currentSearchParams: string,
  query: string,
) {
  const normalizedQuery = normalizePublicListingsSearchQuery(query);
  const params = new URLSearchParams(currentSearchParams);

  if (normalizedQuery) {
    params.set(PUBLIC_LISTINGS_QUERY_PARAM, normalizedQuery);
    params.set(PUBLIC_LISTINGS_PAGE_PARAM, "1");
  } else {
    params.delete(PUBLIC_LISTINGS_QUERY_PARAM);
    params.delete(PUBLIC_LISTINGS_PAGE_PARAM);
  }

  return params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
}
