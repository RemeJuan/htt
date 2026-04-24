# Architecture

## Scope

As-built architecture for current repository state at `/Users/remelehane/Projects/htt`.

Sources: application code, config, generated types, scripts, Supabase Edge Functions, repo docs. Where implementation or schema evidence is missing from repo, this document says **Not found in repo**.

## System summary

- Runtime: Next.js 16 App Router app deployed to Cloudflare Workers via OpenNext.
- Data/auth backend: Supabase.
- Primary domain model: public and private habit-tracker listings.
- Main capabilities implemented now:
  - Public listing browse and detail pages.
  - Email/password and GitHub-based authentication.
  - Auth-gated dashboard.
  - Listing creation.
  - Listing read/update/delete data-access functions.
  - Seed, import, publish, and marketing automation utilities.

Key files:
- `package.json`
- `next.config.ts`
- `open-next.config.ts`
- `wrangler.jsonc`
- `app/**`
- `lib/**`
- `components/**`
- `scripts/**`
- `supabase/functions/**`

## Runtime architecture

### Web application

- Framework: Next.js App Router (`next@16.2.4`) with React 19.
- Root layout: `app/layout.tsx`
  - Sets site metadata.
  - Bootstraps theme state on `document.documentElement` using `data-theme`, `data-theme-mode`, and `colorScheme`.
  - Wraps all pages with `ThemeProvider` and `AppShell`.
- Shared shell: `components/app-shell.tsx`
  - Renders `Navbar` and max-width content container.
- Navbar: `components/navbar.tsx`
  - Client-side auth awareness via Supabase browser client.
  - Shows `Listings`, `Dashboard`, `Account`, plus login/signup or logout.

### Dynamic vs static behavior

Dynamic rendering is explicitly used for authenticated or runtime-dependent areas:
- `app/dashboard/page.tsx`
- `app/dashboard/account/page.tsx`
- `app/dashboard/listings/page.tsx`
- `app/dashboard/listings/new/page.tsx`
- `app/api/public-listings/route.ts`

Public listing pages also fetch live data from Supabase server-side:
- `app/listings/page.tsx`
- `app/listings/[slug]/page.tsx`

Repo docs and config indicate this app is intended for runtime execution on Workers, not static export.

## Route structure

### Public routes

- `/` → `app/page.tsx`
  - Home page.
  - Loads four recent published listings with `getPublishedListings({ sort: "newest", limit: 4 })`.
  - Links to `/listings` and `/dashboard/listings/new`.

- `/listings` → `app/listings/page.tsx`
  - Public browse page.
  - Reads search params with `readPublicListingsSearchParams`.
  - Loads first page from `getPublishedListingsPage`.
  - Hands client interaction to `components/listings/public-listings-browser.tsx`.

- `/listings/[slug]` → `app/listings/[slug]/page.tsx`
  - Public detail page for one published listing.
  - Uses `getPublishedListingBySlug` for both page rendering and metadata generation.
  - Returns `notFound()` if slug lookup fails.

- `/api/public-listings` → `app/api/public-listings/route.ts`
  - JSON API for public browse pagination/search.
  - Accepts `cursor` and `q`.
  - Returns 400 on invalid cursor.
  - Returns generic 500 on other failures.
  - Marked `dynamic = "force-dynamic"`.

### Auth routes

- `/login` → `app/login/page.tsx`
- `/signup` → `app/signup/page.tsx`
- `/reset-password` → `app/reset-password/page.tsx`
- `/auth/callback` → `app/auth/callback/page.tsx`

Shared auth UI lives in `components/auth-form.tsx`.

### Authenticated dashboard routes

- `/dashboard` → `app/dashboard/page.tsx`
  - Requires authenticated user.
  - Displays owned listing count and links to management areas.

- `/dashboard/account` → `app/dashboard/account/page.tsx`
  - Requires authenticated user.
  - Renders `components/account-settings.tsx`.
  - Supports GitHub identity linking.

- `/dashboard/listings` → `app/dashboard/listings/page.tsx`
  - Requires authenticated user.
  - Displays current user’s listings.
  - UI is read-only in current repo state.

- `/dashboard/listings/new` → `app/dashboard/listings/new/page.tsx`
  - Requires authenticated user.
  - Renders listing creation form.

### Routes not found in repo

- Dashboard listing edit page: **Not found in repo**.
- Dashboard listing delete page: **Not found in repo**.
- Password update UI after reset email flow: **Not found in repo**.

## Supabase integration

### Environment contract

Defined in `lib/env.ts`.

Required public/runtime inputs:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or fallback `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Operational/server-only inputs used by scripts/functions:
- `SUPABASE_SERVICE_ROLE_KEY`
- Supabase Edge Function secrets such as `MARKETING_TOKEN`, `PROJECT_URL`, `SERVICE_KEY`.

Important behavior:
- `supabaseKey` prefers publishable key over anon key.
- `getCanonicalSiteUrl()` requires absolute `NEXT_PUBLIC_SITE_URL`.
- `getAuthCallbackUrl(next)` builds `/auth/callback/?next=...` against canonical site origin.

### Client construction

- Browser/server factories: `lib/auth.ts`
  - Browser client memoized as singleton.
  - Uses `@supabase/ssr` typed with `Database`.

- Server request client: `lib/supabase-server.ts`
  - Builds a cookie-backed server client from `next/headers`.
  - Attempts cookie writes.
  - Silently ignores cookie write failures during read-only render contexts.

- Browser client re-export: `lib/supabase.ts`
  - Exposes `getSupabaseBrowserClient` and env presence helper.

### Access patterns

- Authenticated request/response flows use cookie-backed clients.
- Public listing reads in `lib/public-listings.ts` use direct `createClient(env.supabaseUrl, supabaseKey)` instead of per-request cookie client.
- Scripts and automation use service-role/admin access.
- Some Edge Functions call Supabase REST endpoints directly with `fetch` instead of `supabase-js`.

## Authentication architecture

### Supported auth flows

Implemented in `components/auth-form.tsx` and `app/auth/callback/page.tsx`.

1. **Email/password sign-up**
   - `supabase.auth.signUp(...)`
   - Redirect target uses `getAuthCallbackUrl(safeNext)`.

2. **Email/password sign-in**
   - `supabase.auth.signInWithPassword(...)`

3. **GitHub OAuth sign-in**
   - `supabase.auth.signInWithOAuth({ provider: "github" ... })`
   - Callback target is `/auth/callback`.

4. **Password reset email**
   - `supabase.auth.resetPasswordForEmail(..., { redirectTo: getAuthCallbackUrl("/dashboard") })`

5. **GitHub identity linking for signed-in users**
   - `components/account-settings.tsx`
   - Loads identities with `supabase.auth.getUserIdentities()`.
   - Links GitHub with `supabase.auth.linkIdentity(...)`.

6. **Logout**
   - `components/logout-button.tsx`
   - Uses `supabase.auth.signOut()` then client redirect to `/`.

### Callback handling

`app/auth/callback/page.tsx` implements callback processing.

Behavior:
- Reads `code`, `error`, `next`, and optional `linked` from URL.
- Rejects unsafe redirect targets.
- Exchanges OAuth/signup/reset code for session via `supabase.auth.exchangeCodeForSession(code)`.
- Redirects to safe `next` path on success.
- Shows error state on failure.

### Route protection

`lib/auth-user.ts` exports `requireAuthenticatedUser(nextPath)`.

Behavior:
- Uses server Supabase client and `supabase.auth.getUser()`.
- Redirects unauthenticated users to `/login?next=...`.

## Listings domain model

### Source of schema truth in repo

Current schema evidence in repo comes from generated types file:
- `lib/database.types.ts`

SQL migrations backing that schema: **Not found in repo**.

### Tables found in generated types

#### `public.profiles`

Columns present in generated types:
- `id`
- `display_name`
- `username`
- `avatar_url`
- `created_at`
- `updated_at`

#### `public.listings`

Columns present in generated types:
- `id`
- `user_id`
- `name`
- `slug`
- `platforms` (`string[]`)
- `urls` (`Record<string, string>`-style JSON object)
- `website_url`
- `description`
- `status`
- `is_claimed`
- `created_at`
- `updated_at`

Enum present in generated types:
- `listing_status = "draft" | "published"`

Relationship present in generated types:
- `listings.user_id -> profiles.id`

## Listing validation and canonical rules

Source of truth: `lib/listing-validation.ts`

Implemented rules:
- Allowed platforms: `Android`, `iOS`, `macOS`, `Windows`, `Linux`, `Web`
- Allowed statuses: `draft`, `published`
- Slug validation via canonical regex helper.
- At least one platform required.
- Each selected platform must have a valid HTTP/HTTPS URL.
- `website_url` optional, but if present must be valid HTTP/HTTPS.

Notable implementation detail:
- `generateListingSlug(name)` appends random 5-character suffix.
- If the sanitized base name is empty, function returns empty string.

## Listing CRUD flow

### Data access layer

Core listing operations live in `lib/listings.ts`:
- `getOwnListings(userId)`
- `getOwnListingById(userId, id)`
- `getPublishedListings(...)`
- `getPublishedListingBySlug(slug)`
- `createListing(userId, input)`
- `updateListing(userId, id, input)`
- `deleteListing(userId, id)`

Behavior notes:
- Ownership scoping applied to private reads and mutations.
- Failures log through `logger.error`.
- Several query chains use `as any` casts.

### Create flow implemented in UI

Current create flow:

1. User opens `/dashboard/listings/new`.
2. Page renders `components/listings/listing-form.tsx`.
3. Form uses `useActionState` bound to `createListingAction` in `app/dashboard/listings/actions.ts`.
4. `validateListing(formData)` builds normalized payload from:
   - `name`
   - `slug`
   - selected platforms
   - platform-specific URLs
   - `website_url`
   - `description`
   - `status`
   - `is_claimed`
5. Server action checks auth.
6. Server action calls `createListing(user.id, input)`.
7. On success, cache revalidation runs for:
   - `/dashboard`
   - `/dashboard/listings`
   - `/listings`
   - `/listings/${input.slug}`

Implementation details from form component:
- Slug auto-generated from name only for new listing flow.
- Slug field is read-only.
- Platform picker is custom multi-select.
- Per-platform URL inputs render only when platform selected.
- `is_claimed` defaults to checked when creating a new listing.

### Update/delete flow status

- Data-layer update function exists: `lib/listings.ts`.
- Data-layer delete function exists: `lib/listings.ts`.
- Dashboard edit route/UI: **Not found in repo**.
- Dashboard delete route/UI: **Not found in repo**.

## Public listings architecture

### Query layer

Primary implementation: `lib/public-listings.ts`

Implemented behavior:
- Reads only `status = published`.
- Page size constant: `PUBLIC_LISTINGS_PAGE_SIZE = 20`.
- Search applies `ilike` matching across:
  - `name`
  - `slug`
  - `description`
  - `website_url`
- Supports optional platform filtering in query layer.
- Cursor pagination uses base64url-encoded `{ created_at, slug }`.
- Supports newest/oldest sort modes.
- Sanitizes response before use.

Primary methods:
- `getPublishedListingsPage(...)`
- `getPublishedListingBySlug(slug)`

### Shared public page state and cache

Primary implementation: `lib/public-listings-shared.ts`

Implemented client cache behavior:
- Defines `PublicListing` and `PublicListingsPage` types.
- Sanitizes unknown data before use.
- Merges pages by unique slug.
- Caches page state in:
  - in-memory `Map`
  - `sessionStorage`
- Restores cached tail only if initial server page matches prefix of cached page.

### Search state handling

Primary implementation: `lib/public-listings-search.ts`

Implemented behavior:
- Query param name: `q`
- Page param name: `page`
- Search query trimmed, whitespace-normalized, max 100 chars.
- Changing query resets page to `1`.

### Client browse UI

Primary implementation: `components/listings/public-listings-browser.tsx`

Implemented behavior:
- Maintains draft and debounced search state.
- Debounce interval: 300ms.
- Updates URL with `router.replace(..., { scroll: false })`.
- Shows loading state during search transition.
- Shows distinct empty states for blank feed vs no search results.
- Delegates listing rendering/infinite-feed behavior to `PublicListingsFeed`.

### Card/detail presentation

- Card UI: `components/listings/public-listing-card.tsx`
  - Links to listing detail page.
  - Uses `website_url` or first platform URL as external link fallback.

- Detail page: `app/listings/[slug]/page.tsx`
  - Displays name, platform chips, website URL, per-platform URLs, description.

## Account and identity management

Current account management page: `app/dashboard/account/page.tsx`

Backed by `components/account-settings.tsx`.

Implemented now:
- Shows signed-in email.
- Loads linked identities.
- Indicates whether GitHub identity is linked.
- Supports GitHub connect/reconnect flow.

Profile editing, username editing, avatar upload, or local profile CRUD UI: **Not found in repo**.

## Scripts and automation

### Shared bootstrap

`scripts/lib.mjs`

Responsibilities:
- Loads env via `@next/env`.
- Creates service-role Supabase client.
- Finds or creates seed auth user `seed.listings@example.com`.
- Upserts matching `profiles` row.

### Seed data

`scripts/seed.mjs`

Behavior:
- Upserts six sample listings.
- Uses slug conflict handling.
- Associates rows with seed user.

### iOS import script

`scripts/import-ios.mjs`

Behavior:
- Calls Apple iTunes Search API.
- Accepts region/search controls from CLI flags or env.
- Normalizes results into listing shape.
- Sets imported records to `status = published` and `is_claimed = false`.
- Deduplicates by iOS/App Store URL.
- If matching record belongs to another owner, skips it.
- If matching record belongs to same owner, preserves existing slug, status, and claimed state during update.
- Otherwise inserts new row with generated available slug.

### Publish script

`scripts/publish-ios.mjs`

Behavior:
- Finds draft iOS listings owned by seed user.
- Updates them to `published`.

## Supabase Edge Functions

Found in repo under `supabase/functions/`:
- `marketing-random-listing`
- `ios-import-dispatcher`
- `ios-import-region`

### `marketing-random-listing`

File: `supabase/functions/marketing-random-listing/index.ts`

Behavior implemented now:
- Deno Edge Function with CORS handling.
- Authenticated by custom `x-marketing-token` header against `MARKETING_TOKEN` secret.
- Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Reads published listings through PostgREST `fetch` calls.
- Orders by `last_marketed_at.nullslast`, samples one listing from first 50 rows, updates selected row with current `last_marketed_at`, returns generated tweet/thread copy.
- Uses `NEXT_PUBLIC_SITE_URL` if present, else falls back to `https://htt.remej.dev`.

Schema note:
- This function and `docs/marketing-edge-function.md` reference `last_marketed_at`.
- `lib/database.types.ts` does **not** include `last_marketed_at` on `public.listings`.
- Supporting migration SQL: **Not found in repo**.

### `ios-import-dispatcher`

File: `supabase/functions/ios-import-dispatcher/index.ts`

Behavior implemented now:
- Deno Edge Function.
- Uses `PROJECT_URL` and `SERVICE_KEY`.
- Computes weekly region schedule across `US`, `GB`, `CA`, `AU`, `NZ`, `IE`, `DE`, `FR`, `NL`, `SE`, `ZA`.
- Accepts override body with `regions`, `limit`, `terms`, `dayOverride`.
- Dispatches POST requests to `ios-import-region`.
- Returns per-region dispatch summary.

### `ios-import-region`

File: `supabase/functions/ios-import-region/index.ts`

Behavior implemented now:
- Deno Edge Function.
- Uses admin client with `PROJECT_URL` and `SERVICE_KEY`.
- Contains importer logic similar to `scripts/import-ios.mjs`.
- Supports dry-run mode.
- Validates method/body/country/terms.
- Bootstraps seed user/profile as needed.
- Returns `success`, `partial`, or `error` summary.

### Scheduling and Supabase SQL wiring

`docs/ios-import-edge-functions.md` describes scheduling through `pg_cron` and `pg_net`, including migration `20260424000000_ios_import_cron.sql` and database settings under `app.settings.*`.

Supporting SQL migration/config source: **Not found in repo**.

## Deployment architecture

### Cloudflare target

Primary config: `wrangler.jsonc`

Current deployment shape:
- Worker name: `htt`
- Main entry: `.open-next/worker.js`
- Static assets binding: `ASSETS` → `.open-next/assets`
- Compatibility flag: `nodejs_compat`
- Observability enabled

### OpenNext build path

Primary config: `open-next.config.ts`

Behavior:
- Uses `defineCloudflareConfig()`.
- Overrides OpenNext app build command to `npm run build:app`.

### Next.js config relevant to deployment

Primary config: `next.config.ts`

Current notable settings:
- `trailingSlash: true`
- `images.unoptimized = true`
- `turbopack.root` pinned to repo config directory

### Package scripts

From `package.json`:
- Dev: `npm run dev`
- Build: `npm run build` → `opennextjs-cloudflare build`
- App build only: `npm run build:app` → `next build`
- Preview: `npm run preview`
- Deploy: `npm run deploy`

## Operational notes

### Local/dev commands documented in repo

- Install: `npm ci`
- Dev server: `npm run dev`
- Verification target from repo instructions: `npm run lint && npm run test && npm run build`
- Seed sample data: `npm run seed`
- Import iOS listings: `npm run import:ios`
- Publish imported iOS drafts: `npm run publish:ios`

### Generated artifacts and source-of-truth boundaries

- `lib/database.types.ts` is generated and should not be hand-edited.
- Repo docs say types should be regenerated after schema changes.
- Listing validation rules are centralized in `lib/listing-validation.ts`.

### Important external dependencies reflected in code

- Supabase Auth and database.
- Apple iTunes Search API for iOS import.
- Cloudflare Workers/OpenNext runtime.
- GitHub OAuth provider through Supabase Auth.

## Known constraints and technical debt visible in repo

### Schema/repo mismatch risk

- No Supabase migration SQL checked into repo.
- Generated types and docs/functions are not fully aligned.
- `last_marketed_at` referenced by marketing docs/function but absent from generated types.

### CRUD completeness gap

- Data-layer update/delete functions exist.
- End-user edit/delete pages and flows are not present in current route tree.

### Type-safety gaps

- `lib/listings.ts` and `lib/public-listings.ts` use multiple `as any` casts around Supabase query builders.

### Public feed complexity

- Public browse state spans server load, API route, in-memory cache, and `sessionStorage` cache.
- Cache restore/merge logic is custom.

### Auth/account completeness gap

- Reset email flow exists.
- Password update screen after callback is not present.
- Account page focuses on linked identities, not broader profile management.

### Runtime dependence

- Repo docs state static Pages output is unsuitable for auth/protected flows.
- Architecture depends on live server/runtime behavior on Workers.

### Automation maturity

- Marketing function selection logic is lightweight: order by `last_marketed_at`, then random sample from first 50 rows.
- Scheduling for iOS importer is documented, but SQL implementation evidence is missing from repo.

## Items explicitly not evidenced in repo

- Supabase SQL migrations.
- Verified schema source for `last_marketed_at`.
- Dashboard edit/delete listing UI routes.
- Password update page after reset callback.
- Automated infrastructure definition for Supabase cron/net setup.
- Additional tables beyond `profiles` and `listings` in generated types.
