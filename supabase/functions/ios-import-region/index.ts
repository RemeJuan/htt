import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

// --- Shared helpers (adapted from scripts/import-ios.mjs) ---

const DEFAULT_TERMS = ["habit tracker", "streak tracker", "journaling", "productivity", "to do"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function appStoreUrl(trackId: string): string {
  return `https://apps.apple.com/app/id${trackId}`;
}

function buildImportedSlug(name: string | null, trackId: string): string {
  const slugBase = slugify(name || `ios-app-${trackId}`) || "ios-app";
  return `${slugBase}-${trackId}`;
}

function pickAvailableSlug(
  preferredSlug: string,
  trackId: string,
  takenSlugs: Set<string>,
): string {
  const fallbackCandidates = [preferredSlug, `ios-${trackId}`, `ios-app-${trackId}`];

  for (const candidate of fallbackCandidates) {
    if (!takenSlugs.has(candidate)) {
      return candidate;
    }
  }

  let suffix = 2;
  while (takenSlugs.has(`ios-app-${trackId}-${suffix}`)) {
    suffix += 1;
  }

  return `ios-app-${trackId}-${suffix}`;
}

interface AppleResult {
  trackId: string | number;
  trackName: string;
  sellerUrl?: string;
  description?: string;
}

function normalizeResult(item: AppleResult | null) {
  const trackId = item?.trackId ? String(item.trackId) : null;
  const name = item?.trackName?.trim();

  if (!trackId || !name) {
    return null;
  }

  return {
    trackId,
    name,
    slug: buildImportedSlug(name, trackId),
    urls: { ios: appStoreUrl(trackId) },
    website_url: item.sellerUrl?.trim() || null,
    description: item.description?.trim() || null,
    platforms: ["iOS"],
    status: "published",
    is_claimed: false,
  };
}

async function fetchResults(
  terms: string[],
  country: string,
  limit: number,
): Promise<AppleResult[]> {
  const items: AppleResult[] = [];

  for (const term of terms) {
    const url = new URL("https://itunes.apple.com/search");
    url.searchParams.set("term", term);
    url.searchParams.set("media", "software");
    url.searchParams.set("entity", "software");
    url.searchParams.set("country", country);
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Apple search failed for term "${term}" with status ${response.status}.`);
    }

    const data = await response.json();
    items.push(...(data.results ?? []));
  }

  return items;
}

function uniqueByTrackId(results: AppleResult[]): AppleResult[] {
  const seen = new Set<string>();

  return results.filter((item) => {
    const trackId = item?.trackId ? String(item.trackId) : null;

    if (!trackId || seen.has(trackId)) {
      return false;
    }

    seen.add(trackId);
    return true;
  });
}

// --- Seed user management (adapted from scripts/lib.mjs) ---

const SEED_USER = {
  email: "seed.listings@example.com",
  password: "SeedListings123!",
  email_confirm: true,
  user_metadata: {
    username: "seed-listings",
    display_name: "Seed Listings",
  },
};

async function findUserByEmail(supabase: ReturnType<typeof createClient>, email: string) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) throw error;

    const user = data.users.find((item) => item.email === email);
    if (user) return user;
    if (data.users.length < 100) return null;

    page += 1;
  }
}

async function getOrCreateSeedUser(supabase: ReturnType<typeof createClient>) {
  const existing = await findUserByEmail(supabase, SEED_USER.email);
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser(SEED_USER);
  if (error) throw error;

  return data.user;
}

async function upsertSeedProfile(supabase: ReturnType<typeof createClient>, user: { id: string }) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username: SEED_USER.user_metadata.username,
      display_name: SEED_USER.user_metadata.display_name,
      avatar_url: null,
    },
    { onConflict: "id" },
  );

  if (error) throw error;
}

// --- Main import logic ---

const MAX_PROCESS_CAP = 200; // defensive cap matching original script validation

interface ImportSummary {
  country: string;
  requestedLimit: number;
  receivedCount: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  started: string;
  finished: string;
  status: "success" | "partial" | "error";
  error?: string;
}

async function runImport(
  supabase: ReturnType<typeof createClient>,
  country: string,
  limit: number,
  terms: string[],
): Promise<ImportSummary> {
  const started = new Date().toISOString();
  const summary: ImportSummary = {
    country,
    requestedLimit: limit,
    receivedCount: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    started,
    finished: "",
    status: "success",
  };

  try {
    const user = await getOrCreateSeedUser(supabase);
    await upsertSeedProfile(supabase, user);

    const rawResults = await fetchResults(terms, country, limit);
    const uniqueResults = uniqueByTrackId(rawResults);
    const normalized = uniqueResults.map(normalizeResult).filter(Boolean);

    summary.receivedCount = normalized.length;

    // Load existing listings for upsert logic
    const { data: existingListings, error: listingsError } = await supabase
      .from("listings")
      .select("id, slug, user_id, status, is_claimed, urls");

    if (listingsError) throw listingsError;

    const existingByIosUrl = new Map(
      (existingListings ?? [])
        .filter((row: { urls?: { ios?: string } }) => row.urls?.ios)
        .map(
          (row: {
            urls: { ios: string };
            slug: string;
            user_id: string;
            status: string;
            is_claimed: boolean;
          }) => [row.urls.ios, row],
        ),
    );
    const takenSlugs = new Set((existingListings ?? []).map((row: { slug: string }) => row.slug));

    for (const item of normalized) {
      try {
        const existing = existingByIosUrl.get(item.urls.ios);

        if (existing && existing.user_id !== user.id) {
          summary.skipped += 1;
          console.warn(
            `Skipped ${item.name} (${item.trackId}): iOS URL already belongs to another owner.`,
          );
          continue;
        }

        const slug = existing
          ? existing.slug
          : pickAvailableSlug(item.slug, item.trackId, takenSlugs);

        if (!existing) {
          takenSlugs.add(slug);
        }

        const payload = {
          user_id: user.id,
          name: item.name,
          slug,
          platforms: item.platforms,
          urls: item.urls,
          website_url: item.website_url,
          description: item.description,
          status: existing?.status ?? item.status,
          is_claimed: existing?.is_claimed ?? item.is_claimed,
        };

        if (existing) {
          const { error } = await supabase.from("listings").update(payload).eq("id", existing.id);

          if (error) throw error;

          summary.updated += 1;
          continue;
        }

        const { error } = await supabase.from("listings").insert(payload);

        if (error) throw error;

        summary.inserted += 1;
      } catch (error) {
        summary.failed += 1;
        console.warn(
          `Failed ${item.name} (${item.trackId}): ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  } catch (error) {
    summary.status = "error";
    summary.error = error instanceof Error ? error.message : String(error);
  }

  summary.finished = new Date().toISOString();

  if (summary.status !== "error" && summary.failed > 0) {
    summary.status = "partial";
  }

  return summary;
}

// --- HTTP handler ---

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("PROJECT_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SERVICE_KEY")?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: {
    country?: string;
    limit?: number;
    dryRun?: boolean;
    terms?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const country = (body.country ?? "ZA").trim().toUpperCase();
  const limit = Math.min(Math.max(1, Number(body.limit ?? 10)), MAX_PROCESS_CAP);
  const dryRun = body.dryRun === true;
  const terms = body.terms ?? DEFAULT_TERMS;

  // Validate country code
  if (!/^[A-Z]{2}$/.test(country)) {
    return new Response(JSON.stringify({ error: "Country must be a two-letter store code" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate terms
  if (!Array.isArray(terms) || terms.length === 0) {
    return new Response(JSON.stringify({ error: "Provide at least one import term" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (dryRun) {
    // Dry run: fetch results but don't upsert
    const started = new Date().toISOString();
    try {
      const rawResults = await fetchResults(terms, country, limit);
      const uniqueResults = uniqueByTrackId(rawResults);
      const normalized = uniqueResults.map(normalizeResult).filter(Boolean);

      const summary: ImportSummary = {
        country,
        requestedLimit: limit,
        receivedCount: normalized.length,
        inserted: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        started,
        finished: new Date().toISOString(),
        status: "success",
      };

      return new Response(JSON.stringify({ dryRun: true, summary }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const summary: ImportSummary = {
        country,
        requestedLimit: limit,
        receivedCount: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        started,
        finished: new Date().toISOString(),
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };

      return new Response(JSON.stringify({ dryRun: true, summary }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const summary = await runImport(supabase, country, limit, terms);

  const statusCode = summary.status === "error" ? 500 : 200;

  return new Response(JSON.stringify({ summary }), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
