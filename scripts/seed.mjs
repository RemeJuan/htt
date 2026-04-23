import { createSupabaseClient, getOrCreateSeedUser, seedUser, upsertSeedProfile } from "./lib.mjs";

const supabase = createSupabaseClient();

const listings = [
  {
    slug: "focus-flow",
    name: "Focus Flow",
    platforms: ["Web", "iOS"],
    urls: {
      web: "https://example.com/focus-flow",
      ios: "https://apps.apple.com/app/id1234567890",
    },
    website_url: "https://focus-flow.example.com",
    status: "published",
    description: "Task planner for deep work and daily routines.",
    is_claimed: true,
  },
  {
    slug: "night-shift-planner",
    name: "Night Shift Planner",
    platforms: ["Android", "Web"],
    urls: {
      android: "https://play.google.com/store/apps/details?id=com.example.nightshift",
      web: "https://example.com/night-shift-planner",
    },
    website_url: "https://night-shift-planner.example.com",
    status: "draft",
    description: "Shift scheduling for hourly teams and managers.",
    is_claimed: true,
  },
  {
    slug: "ops-dashboard",
    name: "Ops Dashboard",
    platforms: ["Windows", "macOS"],
    urls: {
      windows: "https://example.com/ops-dashboard/windows",
      macos: "https://example.com/ops-dashboard/macos",
    },
    website_url: "https://ops-dashboard.example.com",
    status: "published",
    description: "Desktop command center for support and operations.",
    is_claimed: true,
  },
  {
    slug: "habit-tracker",
    name: "Habit Tracker",
    platforms: ["Web"],
    urls: {
      web: "https://example.com/habit-tracker",
    },
    website_url: "https://habit-tracker.example.com",
    status: "draft",
    description: "Simple habits, streaks, and reminders.",
    is_claimed: true,
  },
  {
    slug: "linux-launcher",
    name: "Linux Launcher",
    platforms: ["Linux", "Web"],
    urls: {
      linux: "https://example.com/linux-launcher",
      web: "https://example.com/linux-launcher/web",
    },
    website_url: null,
    status: "published",
    description: "App launcher and update manager for Linux.",
    is_claimed: true,
  },
  {
    slug: "ios-quick-capture",
    name: "iOS Quick Capture",
    platforms: ["iOS"],
    urls: {
      ios: "https://apps.apple.com/app/id9876543210",
    },
    website_url: "https://ios-quick-capture.example.com",
    status: "draft",
    description: "Fast notes and voice capture on the move.",
    is_claimed: true,
  },
];

async function main() {
  const user = await getOrCreateSeedUser(supabase);
  await upsertSeedProfile(supabase, user);

  const { error: listingsError } = await supabase.from("listings").upsert(
    listings.map((listing) => ({
      ...listing,
      user_id: user.id,
    })),
    { onConflict: "slug" },
  );

  if (listingsError) throw listingsError;

  console.log(`Seeded ${listings.length} listings for ${seedUser.email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
