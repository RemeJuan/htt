import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const seedUser = {
  email: "seed.listings@example.com",
  password: "SeedListings123!",
  email_confirm: true,
  user_metadata: {
    username: "seed-listings",
    display_name: "Seed Listings",
  },
};

const listings = [
  {
    slug: "cozy-studio-brooklyn",
    name: "Cozy Studio in Brooklyn",
    platform: "airbnb",
    url: "https://example.com/listings/cozy-studio-brooklyn",
    status: "published",
    description: "Bright studio near transit and cafes.",
    is_claimed: true,
  },
  {
    slug: "downtown-loft-nyc",
    name: "Downtown Loft NYC",
    platform: "vrbo",
    url: "https://example.com/listings/downtown-loft-nyc",
    status: "draft",
    description: "Spacious loft with skyline views.",
    is_claimed: true,
  },
  {
    slug: "desert-casita-phx",
    name: "Desert Casita",
    platform: "airbnb",
    url: "https://example.com/listings/desert-casita-phx",
    status: "published",
    description: "Quiet retreat with patio and parking.",
    is_claimed: true,
  },
  {
    slug: "lakehouse-weekend",
    name: "Lakehouse Weekend",
    platform: "booking",
    url: "https://example.com/listings/lakehouse-weekend",
    status: "draft",
    description: "Waterfront listing for weekend stays.",
    is_claimed: true,
  },
  {
    slug: "mountain-cabin-slc",
    name: "Mountain Cabin",
    platform: "direct",
    url: "https://example.com/listings/mountain-cabin-slc",
    status: "published",
    description: "Cabin base for hiking and skiing.",
    is_claimed: true,
  },
  {
    slug: "midtown-flat-toronto",
    name: "Midtown Flat",
    platform: "vrbo",
    url: "https://example.com/listings/midtown-flat-toronto",
    status: "draft",
    description: "Compact city flat near the subway.",
    is_claimed: true,
  },
];

async function findUserByEmail(email) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    const user = data.users.find((item) => item.email === email);
    if (user) return user;
    if (data.users.length < 100) return null;

    page += 1;
  }
}

async function getOrCreateSeedUser() {
  const existing = await findUserByEmail(seedUser.email);
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser(seedUser);
  if (error) throw error;

  return data.user;
}

async function main() {
  const user = await getOrCreateSeedUser();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username: seedUser.user_metadata.username,
      display_name: seedUser.user_metadata.display_name,
      avatar_url: null,
    },
    { onConflict: "id" },
  );

  if (profileError) throw profileError;

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
