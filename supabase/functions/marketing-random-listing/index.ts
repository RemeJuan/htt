import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface Listing {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platforms: string[];
  website_url: string | null;
  status: string;
  last_marketed_at: string | null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-marketing-token, content-type",
};

// Static hooks (no randomness needed)
const hooks = [
  "Most habit trackers track. This one commits.",
  "Stop casually tracking habits.",
  "Your habits deserve more than a checkbox.",
];

/**
 * Sanitize text:
 * - Trim whitespace
 * - Collapse multiple spaces
 * - Remove trailing fragments (<3 chars at end)
 * - Hard cap at maxLen chars, cut at last full word
 * - Remove trailing incomplete punctuation
 */
function sanitizeText(input: string, maxLen = 120): string {
  if (!input) return "";

  // Trim and collapse spaces
  let cleaned = input.trim().replace(/\s+/g, " ");

  // Remove trailing fragments (single letters, broken words)
  cleaned = cleaned.replace(/\s+\S{1,2}$/, "");

  // Remove trailing incomplete punctuation
  cleaned = cleaned.replace(/[,;…]+$/, "");
  cleaned = cleaned.replace(/\s+$\. ?$/, "");

  // Hard cap at maxLen, cut at last full word only if space exists
  if (cleaned.length > maxLen) {
    cleaned = cleaned.substring(0, maxLen);
    const lastSpace = cleaned.lastIndexOf(" ");
    // Cut at last space if exists within last 20 chars (word boundary zone)
    if (lastSpace > maxLen - 20) {
      cleaned = cleaned.substring(0, lastSpace);
    }
    // Clean trailing punctuation after truncation
    cleaned = cleaned.replace(/[,;…]+$/, "").trim();
  }

  return cleaned;
}

/**
 * Get next hook (cycles through static list)
 */
function getHook(index: number): string {
  return hooks[index % hooks.length];
}

/**
 * Validate and shrink output to maxLen chars
 */
function validateAndShrink(lines: string[], maxLen = 280): string[] {
  let output = [...lines];
  const totalLength = output.join("\n").length;

  if (totalLength <= maxLen) return output;

  // Strategy 1: Drop tagline (line index 1)
  if (output.length > 2) {
    output = output.filter((_, i) => i !== 1);
  }

  if (output.join("\n").length <= maxLen) return output;

  // Strategy 2: Shorten hook
  if (output[0].length > 60) {
    output[0] = output[0].substring(0, 60);
  }

  if (output.join("\n").length <= maxLen) return output;

  // Strategy 3: Truncate each line fairly
  const avgPerLine = Math.floor(maxLen / output.length);
  output = output.map((line) => {
    if (line.length > avgPerLine) {
      return line.substring(0, avgPerLine - 3) + "...";
    }
    return line;
  });

  return output;
}

/**
 * Build tweet content from listing data
 */
function buildTweetContent(listing: Listing, hook: string): string[] {
  const siteUrl = Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://htt.remej.dev";
  const link = `${siteUrl}/listings/${listing.slug}`;

  const tagline = sanitizeText(listing.description || "");
  const useTagline = tagline.length >= 20;

  if (useTagline) {
    return validateAndShrink([
      hook,
      tagline,
      link,
      "#HabitTracker",
    ]);
  }

  // Fallback: name-only template
  return validateAndShrink([
    hook,
    listing.name,
    link,
    "#HabitTracker",
  ]);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Token validation
  const marketingToken = req.headers.get("x-marketing-token");
  if (!marketingToken) {
    return new Response(
      JSON.stringify({ error: "Missing x-marketing-token header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const expectedToken = Deno.env.get("MARKETING_TOKEN");
  if (!expectedToken || marketingToken !== expectedToken) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse format param
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "tweet";

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Fetch published listings, ordered by last_marketed_at nulls first
    const listingsRes = await fetch(
      `${supabaseUrl}/rest/v1/listings?status=eq.published&select=id,name,slug,description,platforms,website_url,last_marketed_at&order=last_marketed_at.nullslast&limit=50`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const listings: Listing[] = await listingsRes.json();

    if (!listings || listings.length === 0) {
      return new Response(
        JSON.stringify({ error: "No published listings available" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Random selection
    const selected = listings[Math.floor(Math.random() * listings.length)];

    // Update last_marketed_at = now()
    await fetch(
      `${supabaseUrl}/rest/v1/listings?id=eq.${selected.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ last_marketed_at: new Date().toISOString() }),
      }
    );

    // Build content
    const hookIndex = Math.floor(Math.random() * hooks.length);
    const hook = getHook(hookIndex);

    let content: string | string[];

    if (format === "thread") {
      const tweetLines = buildTweetContent(selected, hook);
      content = [
        `${hook}`,
        `Discover ${selected.name} — ${tweetLines[1] || "a practical habit tracker."}`,
        `Why: Practical tool that actually delivers.`,
        tweetLines[2], // link
        tweetLines[3], // hashtag
      ];
    } else {
      const tweetLines = buildTweetContent(selected, hook);
      content = tweetLines.join("\n");
    }

    return new Response(
      JSON.stringify({
        type: format,
        content,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});