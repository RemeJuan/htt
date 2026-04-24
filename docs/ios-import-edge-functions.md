# iOS Import Edge Functions

Scheduled Supabase Edge Functions that fan-out App Store listing imports across regions.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  ios-import-dispatcher (scheduled daily via pg_cron)        │
│  - Divides 11 regions across 7 days (~2/day)                │
│  - Fires ios-import-region for each region in today's batch │
│  - Returns quick dispatch summary                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ fire-and-forget HTTP POST
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  ios-import-region (per-region import)                      │
│  - Fetches App Store results for one country                │
│  - Normalizes, deduplicates, upserts listings               │
│  - Returns summary: country, counts, status, timing         │
└─────────────────────────────────────────────────────────────┘
```

### Region Schedule

| Day       | Regions |
| --------- | ------- |
| Sunday    | US, GB  |
| Monday    | CA, AU  |
| Tuesday   | NZ, IE  |
| Wednesday | DE, FR  |
| Thursday  | NL, SE  |
| Friday    | ZA      |
| Saturday  | US, GB  |

## Required Secrets

Set these as Supabase Edge Function secrets (not committed to git):

```bash
# Supabase project URL
PROJECT_URL=https://YOUR_PROJECT.supabase.co

# Service role key (admin access for auth + listings upsert)
SERVICE_KEY=eyJhbG...
```

Set secrets via CLI:

````bash
npx supabase secrets set PROJECT_URL="https://YOUR_PROJECT.supabase.co"
npx supabase secrets set SERVICE_KEY="eyJhbG..."
``

Or via Dashboard: **Project Settings → Edge Functions → Secrets**.

## Deploy Commands

```bash
# Deploy both functions
npx supabase functions deploy ios-import-region
npx supabase functions deploy ios-import-dispatcher

# Deploy with linked project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy ios-import-region
npx supabase functions deploy ios-import-dispatcher
````

## Manual Invoke Examples

### Invoke dispatcher (triggers today's region batch)

```bash
curl -X POST "https://YOUR_PROJECT.functions.supabase.co/functions/v1/ios-import-dispatcher" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Invoke dispatcher with overrides

```bash
# Override regions, limit, and terms
curl -X POST "https://YOUR_PROJECT.functions.supabase.co/functions/v1/ios-import-dispatcher" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "regions": ["US", "GB"],
    "limit": 20,
    "terms": ["habit tracker", "streak tracker"]
  }'
```

### Invoke dispatcher for a specific day (0=Sunday, 6=Saturday)

```bash
curl -X POST "https://YOUR_PROJECT.functions.supabase.co/functions/v1/ios-import-dispatcher" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dayOverride": 0}'
```

### Invoke single region import

```bash
curl -X POST "https://YOUR_PROJECT.functions.supabase.co/functions/v1/ios-import-region" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "limit": 15,
    "terms": ["habit tracker", "productivity"]
  }'
```

### Dry run (fetches results but does not upsert)

```bash
curl -X POST "https://YOUR_PROJECT.functions.supabase.co/functions/v1/ios-import-region" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "limit": 10,
    "dryRun": true
  }'
```

## Cron Setup

The SQL migration `20260424000000_ios_import_cron.sql` creates `dispatch_ios_import()` and schedules it daily at 06:00 UTC via `pg_cron` + `pg_net`.

### Apply the migration

```bash
npx supabase db push
```

### Verify cron is scheduled

```sql
SELECT * FROM cron.job WHERE job_name = 'ios-import-daily';
```

### Required database settings for cron

The `dispatch_ios_import()` function reads `app.settings.supabase_url` and `app.settings.service_role_key`. Set these:

```sql
ALTER DATABASE postgres SET app.settings.supabase_url TO 'https://YOUR_PROJECT.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key TO 'your_service_role_key';
```

Or set via Supabase Dashboard → **Database → Settings → Database Configurations**.

## Inspecting Logs

### Edge Function logs (Dashboard)

1. Go to **Edge Functions → [function name] → Logs**
2. Filter by time range and status

### Edge Function logs (CLI)

```bash
npx supabase functions logs ios-import-region
npx supabase functions logs ios-import-dispatcher
```

### Cron job execution logs

View cron job history in Supabase Dashboard → **Database → Cron Jobs → ios-import-daily → History**.

Or query pg_net for HTTP request results:

### pg_net HTTP request logs

```sql
-- Check queued/completed HTTP requests
SELECT * FROM net.http_request_queue ORDER BY created_at DESC LIMIT 10;
```

## Response Format

### ios-import-region response

```json
{
  "summary": {
    "country": "US",
    "requestedLimit": 10,
    "receivedCount": 8,
    "inserted": 5,
    "updated": 2,
    "skipped": 0,
    "failed": 1,
    "started": "2026-04-24T06:00:00.000Z",
    "finished": "2026-04-24T06:00:12.345Z",
    "status": "partial",
    "error": null
  }
}
```

Status values: `success`, `partial` (some failures), `error` (complete failure).

### ios-import-dispatcher response

```json
{
  "message": "iOS import dispatch complete",
  "dayOfWeek": 0,
  "dayName": "Sunday",
  "regionsScheduled": ["US", "GB"],
  "dispatchedCount": 2,
  "failedCount": 0,
  "dispatched": [
    { "region": "US", "status": "dispatched" },
    { "region": "GB", "status": "dispatched" }
  ],
  "timestamp": "2026-04-24T06:00:00.000Z"
}
```

## Safety

- **Max process cap**: 200 results per region (matches original script validation)
- **No hard slicing**: All fetched results are processed up to the cap
- **Fire-and-forget**: Dispatcher does not await region imports; each region runs independently
- **Service role key**: Required for all invocations; not exposed to clients
- **Dry run mode**: Available on `ios-import-region` to preview results without upserting

## Verified Status

- `ios-import-region` — deployed, tested (dry run + full import)
- `ios-import-dispatcher` — deployed, tested (dispatches to region function)
- `SERVICE_KEY` secret — set to service role JWT
- `PROJECT_URL` secret — set
- Cron migration — `dispatch_ios_import()` function created and scheduled

## Remaining Manual Steps

1. **Verify cron is scheduled** in Supabase Dashboard:
   - Go to **Database → Cron Jobs**
   - Confirm `ios-import-daily` appears with schedule `0 6 * * *` (daily at 06:00 UTC)

2. **Test manually** (optional):
   ```sql
   select public.dispatch_ios_import();
   ```
   Then check **Edge Functions → ios-import-dispatcher → Logs** for execution.

## Schedule

Cron runs daily at **06:00 UTC**. Region batch by day:

| Day       | Regions |
| --------- | ------- |
| Sunday    | US, GB  |
| Monday    | CA, AU  |
| Tuesday   | NZ, IE  |
| Wednesday | DE, FR  |
| Thursday  | NL, SE  |
| Friday    | ZA      |
| Saturday  | US, GB  |
