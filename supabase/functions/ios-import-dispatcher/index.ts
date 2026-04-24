// --- Region schedule: 11 regions across 7 days (~2 per day) ---

const SCHEDULE: Record<number, string[]> = {
  0: ["US", "GB"], // Sunday
  1: ["CA", "AU"], // Monday
  2: ["NZ", "IE"], // Tuesday
  3: ["DE", "FR"], // Wednesday
  4: ["NL", "SE"], // Thursday
  5: ["ZA"], // Friday
  6: ["US", "GB"], // Saturday (repeat high-priority)
};

const DEFAULT_TERMS = ["habit tracker", "streak tracker", "journaling", "productivity", "to do"];

interface DispatchResult {
  region: string;
  status: "dispatched" | "failed";
  error?: string;
}

async function invokeRegionImport(
  baseUrl: string,
  apiKey: string,
  country: string,
  limit: number,
  terms: string[],
): Promise<DispatchResult> {
  const url = `${baseUrl}/functions/v1/ios-import-region`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ country, limit, terms }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        region: country,
        status: "failed",
        error: `HTTP ${response.status}: ${text.slice(0, 200)}`,
      };
    }

    return { region: country, status: "dispatched" };
  } catch (error) {
    return {
      region: country,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
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

  // Parse optional overrides from request body
  let body: {
    regions?: string[];
    limit?: number;
    terms?: string[];
    dayOverride?: number;
  } | null = null;

  try {
    body = await req.json().catch(() => null);
  } catch {
    // ignore
  }

  // Determine which day's batch to run
  let dayOfWeek: number;
  if (
    body?.dayOverride !== undefined &&
    Number.isInteger(body.dayOverride) &&
    body.dayOverride >= 0 &&
    body.dayOverride <= 6
  ) {
    dayOfWeek = body.dayOverride;
  } else {
    // Use UTC day of week (0=Sunday, 6=Saturday)
    dayOfWeek = new Date().getUTCDay();
  }

  // Allow manual override of regions, otherwise use schedule
  const regionsToRun = body?.regions ?? SCHEDULE[dayOfWeek] ?? [];

  if (regionsToRun.length === 0) {
    return new Response(
      JSON.stringify({
        message: "No regions scheduled for this day",
        dayOfWeek,
        regions: [],
        dispatched: [],
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const limit = Math.min(Math.max(1, Number(body?.limit ?? 10)), 200);
  const terms = body?.terms ?? DEFAULT_TERMS;

  // Fire-and-forget: dispatch each region without awaiting completion
  const dispatchPromises = regionsToRun.map((region) =>
    invokeRegionImport(supabaseUrl, serviceRoleKey, region, limit, terms),
  );

  const results = await Promise.allSettled(dispatchPromises);

  const dispatched: DispatchResult[] = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      region: regionsToRun[i],
      status: "failed",
      error: r.reason instanceof Error ? r.reason.message : String(r.reason),
    };
  });

  const dispatchedCount = dispatched.filter((r) => r.status === "dispatched").length;
  const failedCount = dispatched.filter((r) => r.status === "failed").length;

  const summary = {
    message: "iOS import dispatch complete",
    dayOfWeek,
    dayName: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
      dayOfWeek
    ],
    regionsScheduled: regionsToRun,
    dispatchedCount,
    failedCount,
    dispatched,
    timestamp: new Date().toISOString(),
  };

  const statusCode = failedCount > 0 && dispatchedCount === 0 ? 500 : 200;

  return new Response(JSON.stringify(summary), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
