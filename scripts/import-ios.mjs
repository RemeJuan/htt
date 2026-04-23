import { pathToFileURL } from "node:url";

import { createSupabaseClient, getOrCreateSeedUser, upsertSeedProfile } from "./lib.mjs";

export const defaults = {
  terms: ["habit tracker", "streak tracker", "journaling", "productivity", "to do"],
  country: "ZA",
  limit: 10,
};

function parseTerms(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseArgs(argv, env = process.env) {
  const options = {
    terms: parseTerms(env.IOS_IMPORT_TERMS ?? defaults.terms.join(",")),
    country: (env.IOS_IMPORT_COUNTRY ?? defaults.country).trim().toUpperCase(),
    limit: Number(env.IOS_IMPORT_LIMIT ?? defaults.limit),
  };

  for (const arg of argv) {
    const [key, ...parts] = arg.split("=");
    const value = parts.join("=");

    if (key === "--terms" && value) {
      options.terms = parseTerms(value);
    }

    if (key === "--country" && value) {
      options.country = value.trim().toUpperCase();
    }

    if (key === "--limit" && value) {
      options.limit = Number(value);
    }
  }

  if (!options.terms.length) {
    throw new Error("Provide at least one import term.");
  }

  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 200) {
    throw new Error("Import limit must be an integer between 1 and 200.");
  }

  if (!/^[A-Z]{2}$/.test(options.country)) {
    throw new Error("Country must be a two-letter store code.");
  }

  return options;
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function appStoreUrl(trackId) {
  return `https://apps.apple.com/app/id${trackId}`;
}

export function buildImportedSlug(name, trackId) {
  const slugBase = slugify(name || `ios-app-${trackId}`) || "ios-app";
  return `${slugBase}-${trackId}`;
}

export function pickAvailableSlug(preferredSlug, trackId, takenSlugs) {
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

export function normalizeResult(item) {
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
    status: "draft",
    is_claimed: false,
  };
}

export async function fetchResults(terms, country, limit) {
  const items = [];

  for (const term of terms) {
    const url = new URL("https://itunes.apple.com/search");
    url.searchParams.set("term", term);
    url.searchParams.set("media", "software");
    url.searchParams.set("entity", "software");
    url.searchParams.set("country", country);
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Apple search failed for term \"${term}\" with status ${response.status}.`);
    }

    const data = await response.json();
    items.push(...(data.results ?? []));
  }

  return items;
}

export function uniqueByTrackId(results) {
  const seen = new Set();

  return results.filter((item) => {
    const trackId = item?.trackId ? String(item.trackId) : null;

    if (!trackId || seen.has(trackId)) {
      return false;
    }

    seen.add(trackId);
    return true;
  });
}

async function loadExistingListings(supabase) {
  const { data, error } = await supabase
    .from("listings")
    .select("id, slug, user_id, status, is_claimed, urls");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function main() {
  const options = parseArgs(process.argv.slice(2));
  const supabase = createSupabaseClient();
  const user = await getOrCreateSeedUser(supabase);
  await upsertSeedProfile(supabase, user);

  const rawResults = await fetchResults(options.terms, options.country, options.limit);
  const uniqueResults = uniqueByTrackId(rawResults);
  const normalized = uniqueResults.map(normalizeResult).filter(Boolean);
  const existingListings = await loadExistingListings(supabase);

  const existingByIosUrl = new Map(
    existingListings
      .filter((row) => row.urls?.ios)
      .map((row) => [row.urls.ios, row]),
  );
  const takenSlugs = new Set(existingListings.map((row) => row.slug));

  const counts = {
    fetched: rawResults.length,
    unique: uniqueResults.length,
    prepared: normalized.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  for (const item of normalized) {
    try {
      const existing = existingByIosUrl.get(item.urls.ios);

      if (existing && existing.user_id !== user.id) {
        counts.skipped += 1;
        console.warn(`Skipped ${item.name} (${item.trackId}): iOS URL already belongs to another owner.`);
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

        if (error) {
          throw error;
        }

        counts.updated += 1;
        continue;
      }

      const { error } = await supabase.from("listings").insert(payload);

      if (error) {
        throw error;
      }

      counts.inserted += 1;
    } catch (error) {
      counts.failed += 1;
      console.warn(`Failed ${item.name} (${item.trackId}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(
    [
      `fetched=${counts.fetched}`,
      `unique=${counts.unique}`,
      `prepared=${counts.prepared}`,
      `inserted=${counts.inserted}`,
      `updated=${counts.updated}`,
      `skipped=${counts.skipped}`,
      `failed=${counts.failed}`,
      `country=${options.country}`,
    ].join(" "),
  );
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
