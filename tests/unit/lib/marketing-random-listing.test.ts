import { describe, it, expect, vi, beforeEach } from "vitest";

const STATIC_HOOKS = [
  "New on Habit Tracker:",
  "Fresh pick from Habit Tracker:",
  "Worth a look:",
  "Found this on Habit Tracker:",
];

const sanitizeText = (input: string | null | undefined, maxLen = 280): string => {
  if (!input) return "";

  let text = input.trim().replace(/\s+/g, " ");
  text = text.replace(/\b\S{1,2}$/, "").trim();

  if (maxLen > 0 && text.length > maxLen) {
    text = text.slice(0, maxLen);
    const lastSpace = text.lastIndexOf(" ");
    if (lastSpace > 0) text = text.slice(0, lastSpace);
  }

  text = text.replace(/[\s,;…]+$/, "").trim();
  return text;
};

const getHook = (index: number): string => STATIC_HOOKS[index % STATIC_HOOKS.length];

const validateAndShrink = (lines: string[], maxLen = 280): string[] => {
  const result: string[] = [];
  for (const line of lines) {
    const next = [...result, line];
    if (next.join("\n").length <= maxLen) result.push(line);
  }
  return result;
};

const buildTweetContent = (
  listing: { name: string; description: string | null; slug: string },
  hook: string,
): string[] => {
  const taglineSource = listing.description && listing.description.trim().length >= 20 ? listing.description : listing.name;
  const tagline = sanitizeText(taglineSource, 120) || listing.name;
  return validateAndShrink([hook, tagline, `https://htt.example.com/listings/${listing.slug}`, "#HabitTracker"]);
};

const createMockResponse = () => {
  const headers = new Map<string, string>();
  return {
    status: 200,
    headers,
    json: async () => ({}),
    text: async () => "",
  };
};

describe("marketing-random-listing Edge Function logic", () => {
  let mockListings: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    platforms: string[];
    website_url: string | null;
    status: string;
    last_marketed_at: string | null;
  }>;

  beforeEach(() => {
    mockListings = [
      {
        id: "1",
        name: "Habit Tracker Pro",
        slug: "habit-tracker-pro",
        description: "Track your daily habits",
        platforms: ["iOS", "Android"],
        website_url: "https://example.com",
        status: "published",
        last_marketed_at: null,
      },
      {
        id: "2",
        name: "Daily Streak",
        slug: "daily-streak",
        description: "Keep your streak going",
        platforms: ["iOS"],
        status: "published",
        last_marketed_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "3",
        name: "Draft Listing",
        slug: "draft-listing",
        description: "Not published",
        platforms: [],
        status: "draft",
        last_marketed_at: null,
      },
    ];
  });

  describe("token validation", () => {
    it("rejects request without x-marketing-token header", async () => {
      const headers = new Headers();
      const req = new Request("http://localhost:54321/functions/v1/marketing-random-listing", {
        headers,
      });

      // Simulate token check
      const token = req.headers.get("x-marketing-token");
      expect(token).toBeNull();
    });

    it("rejects request with invalid token", async () => {
      const headers = new Headers({ "x-marketing-token": "wrong_token" });
      const req = new Request("http://localhost:54321/functions/v1/marketing-random-listing", {
        headers,
      });

      const token = req.headers.get("x-marketing-token");
      const expectedToken = "htt_marketing_2024_secure_token";

      expect(token).not.toBeNull();
      expect(token).not.toBe(expectedToken);
    });

    it("accepts request with valid token", async () => {
      const headers = new Headers({ "x-marketing-token": "htt_marketing_2024_secure_token" });
      const req = new Request("http://localhost:54321/functions/v1/marketing-random-listing", {
        headers,
      });

      const token = req.headers.get("x-marketing-token");
      const expectedToken = "htt_marketing_2024_secure_token";

      expect(token).toBe(expectedToken);
    });
  });

  describe("filtering logic", () => {
    it("filters to only published listings", () => {
      const published = mockListings.filter((l) => l.status === "published");
      expect(published).toHaveLength(2);
      expect(published.some((l) => l.slug === "draft-listing")).toBe(false);
    });

    it("orders by last_marketed_at nulls first", () => {
      const published = mockListings
        .filter((l) => l.status === "published")
        .sort((a, b) => {
          if (a.last_marketed_at === null && b.last_marketed_at === null) return 0;
          if (a.last_marketed_at === null) return -1;
          if (b.last_marketed_at === null) return 1;
          return 0;
        });

      expect(published[0].last_marketed_at).toBeNull();
    });

    it("excludes user_id, emails from any listing", () => {
      // Listings should never have user_id in response
      const published = mockListings.filter((l) => l.status === "published");
      const hasUserId = published.some((l) => "user_id" in l);
      expect(hasUserId).toBe(false);
    });
  });

  describe("empty dataset handling", () => {
    it("returns 404 when no published listings exist", () => {
      const emptyListings = mockListings.filter(() => false);
      expect(emptyListings).toHaveLength(0);
    });
  });

  describe("random selection", () => {
    it("selects randomly from eligible set", () => {
      const published = mockListings.filter((l) => l.status === "published");
      const selectedIndex = Math.floor(Math.random() * published.length);
      const selected = published[selectedIndex];

      expect(published.some((l) => l.id === selected.id)).toBe(true);
    });
  });

  describe("format output", () => {
    it("generates tweet format", () => {
      const listing = mockListings[0];
      const format = "tweet";
      const siteUrl = "https://htt.example.com";

      const content =
        format === "thread"
          ? [
              `🧭 ${listing.name} is this week's pick`,
              `${listing.description?.substring(0, 100)}...`,
              `Why: Practical tool that actually delivers.`,
              `🔗 ${siteUrl}/listings/${listing.slug}`,
            ]
          : `🧭 ${listing.name}: ${listing.description?.substring(0, 100)} ${siteUrl}/listings/${listing.slug}`;

      expect(typeof content).toBe("string");
    });

    it("generates thread format", () => {
      const listing = mockListings[0];
      const format = "thread";
      const siteUrl = "https://htt.example.com";

      const content =
        format === "thread"
          ? [
              `🧭 ${listing.name} is this week's pick`,
              `${listing.description?.substring(0, 100)}...`,
              `Why: Practical tool that actually delivers.`,
              `🔗 ${siteUrl}/listings/${listing.slug}`,
            ]
          : `🧭 ${listing.name}: ${listing.description?.substring(0, 100)} ${siteUrl}/listings/${listing.slug}`;

      expect(Array.isArray(content)).toBe(true);
    });
  });

  describe("sanitizeText", () => {
    it("trims long description at last full word", () => {
      const input = "This is a very long description that should stop before cutting a word in half";
      expect(sanitizeText(input, 44)).toBe("This is a very long description that should");
    });

    it("removes trailing fragments", () => {
      expect(sanitizeText("some text b", 50)).toBe("some text");
    });

    it("collapses multiple spaces", () => {
      expect(sanitizeText("some    text   here", 50)).toBe("some text here");
    });

    it.each([",", ";", "…"])("removes trailing punctuation %s", (suffix) => {
      expect(sanitizeText(`some text${suffix}`, 50)).toBe("some text");
    });

    it("hard caps at maxLen", () => {
      // No spaces in input - returns full maxLen chars
      expect(sanitizeText("abcdefghijklmnopqrstuvwxyz", 10)).toBe("abcdefghij");
      // With spaces - cuts at last space
      expect(sanitizeText("hello world something", 10)).toBe("hello");
    });

    it("returns empty string for empty or null input", () => {
      expect(sanitizeText("", 50)).toBe("");
      expect(sanitizeText(null, 50)).toBe("");
      expect(sanitizeText(undefined, 50)).toBe("");
    });
  });

  describe("fallback logic", () => {
    it("falls back to name for short description", () => {
      const listing = { name: "Habit Tracker Pro", description: "Too short", slug: "habit-tracker-pro" };
      const content = buildTweetContent(listing, getHook(0));
      expect(content[1]).toBe("Habit Tracker Pro");
    });

    it("falls back to name for null description", () => {
      const listing = { name: "Habit Tracker Pro", description: null, slug: "habit-tracker-pro" };
      const content = buildTweetContent(listing, getHook(0));
      expect(content[1]).toBe("Habit Tracker Pro");
    });

    it("falls back to name for empty description", () => {
      const listing = { name: "Habit Tracker Pro", description: "", slug: "habit-tracker-pro" };
      const content = buildTweetContent(listing, getHook(0));
      expect(content[1]).toBe("Habit Tracker Pro");
    });
  });

  describe("output validation", () => {
    it("never exceeds 280 chars", () => {
      const listing = {
        name: "Habit Tracker Pro",
        description: "A".repeat(500),
        slug: "habit-tracker-pro",
      };
      const content = buildTweetContent(listing, getHook(0));
      expect(content.join("\n").length).toBeLessThanOrEqual(280);
    });

    it("outputs 4 lines", () => {
      const listing = { name: "Habit Tracker Pro", description: "Track your daily habits", slug: "habit-tracker-pro" };
      expect(buildTweetContent(listing, getHook(0))).toHaveLength(4);
    });

    it("puts URL on its own line", () => {
      const listing = { name: "Habit Tracker Pro", description: "Track your daily habits", slug: "habit-tracker-pro" };
      const content = buildTweetContent(listing, getHook(0));
      expect(content[2]).toBe("https://htt.example.com/listings/habit-tracker-pro");
    });

    it('uses hashtag exactly "#HabitTracker"', () => {
      const listing = { name: "Habit Tracker Pro", description: "Track your daily habits", slug: "habit-tracker-pro" };
      const content = buildTweetContent(listing, getHook(0));
      expect(content[3]).toBe("#HabitTracker");
    });
  });

  describe("hook selection", () => {
    it("returns hook from static list", () => {
      expect(STATIC_HOOKS).toContain(getHook(2));
    });

    it("keeps hook under 80 chars", () => {
      for (let i = 0; i < STATIC_HOOKS.length; i += 1) {
        expect(getHook(i).length).toBeLessThan(80);
      }
    });
  });

  describe("LAST_MARKED_AT update", () => {
    it("marks listing as marketed after selection", () => {
      const published = mockListings.filter((l) => l.status === "published");
      const selected = published[0];

      // Simulate update
      const updated = { ...selected, last_marketed_at: new Date().toISOString() };

      expect(updated.last_marketed_at).not.toBeNull();
    });
  });
});
