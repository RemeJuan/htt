# Marketing Random Listing Edge Function

Public endpoint that returns one random published habit tracker listing for Hermes scheduled marketing posts.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Hermes (scheduled posting bot)                                 │
│  - Calls with x-marketing-token header only                      │
│  - No Supabase JWT auth required                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTP POST
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  marketing-random-listing                                        │
│  - Validates x-marketing-token header                            │
│  - Fetches published listings via service role key               │
│  - Excludes recently used (last_marketed_at)                    │
│  - Returns random eligible listing                               │
└─────────────────────────────────────────────────────────────────┘
```

## Required Secrets

Set these as Supabase Edge Function secrets (not committed to git):

```bash
# Token for authenticating Hermes requests
MARKETING_TOKEN=your_secure_token_here

# Site URL for constructing listing links
NEXT_PUBLIC_SITE_URL=https://htt.remej.dev
```

Set secrets via CLI:

```bash
npx supabase secrets set MARKETING_TOKEN="your_secure_token_here"
npx supabase secrets set NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

Or via Dashboard: **Project Settings → Edge Functions → Secrets**.

## Endpoint

```
POST https://kxqnlmqyxedoulcmcp.supabase.co/functions/v1/marketing-random-listing
```

## Authentication

| Header | Required | Description |
|--------|----------|-------------|
| `x-marketing-token` | Yes | Token matching `MARKETING_TOKEN` env secret |
| `Content-Type` | Yes | `application/json` |

**No Supabase JWT required.** Uses service role key server-side.

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | `tweet` \| `thread` | `tweet` | Output format |

## Response

### Success (200)

#### Tweet format

```json
{
  "type": "tweet",
  "content": "🧭 Habit Tracker Pro: Track your daily habits with streaks https://htt.app/listings/habit-tracker-pro"
}
```

#### Thread format

```json
{
  "type": "thread",
  "content": [
    "🧭 Habit Tracker Pro is this week's pick",
    "Track your daily habits with streaks...",
    "Why: Practical tool that actually delivers.",
    "🔗 https://htt.app/listings/habit-tracker-pro"
  ]
}
```

### Error (401) — Missing or invalid token

```json
{
  "error": "Missing x-marketing-token header"
}
```

or

```json
{
  "error": "Invalid token"
}
```

### Error (404) — No published listings

```json
{
  "error": "No published listings available"
}
```

## Data Logic

1. **Filter**: Only `status = 'published'` listings
2. **Sort**: `last_marketed_at ASC NULLS FIRST` (prefer unused or oldest-used)
3. **Sample**: Random selection from top 50 eligible
4. **Mark**: Update `last_marketed_at = NOW()` for selected listing
5. **Return**: Safe fields only — name, slug, description, platforms, link

### Excluded from Response

- `user_id` (internal owner)
- `id` (internal identifier)
- `email` (not in listings table, but protected by design)
- `status` (internal state)
- `last_marketed_at` (internal tracking)

## Usage Examples

### Tweet format (default)

```bash
curl -X POST "https://kxqnlmqyxedoulcmcp.supabase.co/functions/v1/marketing-random-listing" \
  -H "x-marketing-token: htt_marketing_2024_secure_token" \
  -H "Content-Type: application/json"
```

### Thread format

```bash
curl -X POST "https://kxqnlmqyxedoulcmcp.supabase.co/functions/v1/marketing-random-listing?format=thread" \
  -H "x-marketing-token: htt_marketing_2024_secure_token" \
  -H "Content-Type: application/json"
```

### Local development (via Supabase CLI)

```bash
npx supabase functions serve marketing-random-listing --env-file .env.local
```

Then:

```bash
curl -X POST "http://localhost:54321/functions/v1/marketing-random-listing" \
  -H "x-marketing-token: htt_marketing_2024_secure_token" \
  -H "Content-Type: application/json"
```

## Deployment

Source of truth: `supabase/functions/marketing-random-listing/index.ts`

```bash
npx supabase functions deploy marketing-random-listing
```

Or via Dashboard: **Edge Functions → Deploy All** or **New Function**.

## Database Schema

The function uses the `listings` table with an added `last_marketed_at` column:

```sql
ALTER TABLE public.listings ADD COLUMN last_marketed_at TIMESTAMPTZ;
```

### Column Details

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (not exposed in response) |
| `name` | text | Listing name |
| `slug` | text | URL-safe identifier |
| `description` | text | Full description (truncated to 100 chars in response) |
| `platforms` | text[] | Supported platforms |
| `website_url` | text | Optional website (not included in response) |
| `status` | listing_status | `draft` or `published` |
| `last_marketed_at` | timestamptz | When last selected for marketing (NULL = never used) |

## Rotation Behavior

- Listings with `last_marketed_at = NULL` are prioritized
- Once used, listing is deprioritized until all published listings are cycled
- When all published listings have been marketed, rotation naturally restarts (oldest-used or NULL first)

## Inspecting Logs

### Edge Function logs (CLI)

```bash
npx supabase functions logs marketing-random-listing
```

### Edge Function logs (Dashboard)

1. Go to **Edge Functions → marketing-random-listing → Logs**
2. Filter by time range and status

### Check marketing state in database

```sql
-- View all listings ordered by marketing priority
SELECT name, slug, status, last_marketed_at,
       CASE WHEN last_marketed_at IS NULL THEN 'never' 
            ELSE EXTRACT(EPOCH FROM (NOW() - last_marketed_at))::text || ' seconds ago'
       END as time_since_marketed
FROM listings 
WHERE status = 'published'
ORDER BY last_marketed_at ASC NULLS FIRST;
```

## Verified Status

- [x] Edge Function deployed (JWT disabled)
- [x] `MARKETING_TOKEN` secret set
- [x] `last_marketed_at` column added to `listings` table
- [x] Unit tests written
- [x] Token validation tested (401 on missing/invalid)
- [x] Successful response tested (tweet + thread formats)

## Hermes Integration

Hermes can call this endpoint with only:

```
POST <endpoint>
Headers:
  x-marketing-token: <MARKETING_TOKEN>
  Content-Type: application/json
```

Parse the `content` field based on `type`. For threads, post each array element as a separate tweet in sequence.