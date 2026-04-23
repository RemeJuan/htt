# Habit Tracker Tracker

_Track your trackers._

![Build](https://img.shields.io/badge/build-GitHub_Actions_placeholder-lightgrey)
![License](https://img.shields.io/badge/license-TBD-lightgrey)
![Vibe Coded](https://img.shields.io/badge/vibe-coded-ff69b4)
![Probably Secure](https://img.shields.io/badge/security-probably_secure-8a2be2)

Too many habit trackers? Track them.
Built 100% with vibes. Probably secure.

## What is this?

A small Next.js app for tracking habit tracker listings.
Auth-backed, Supabase-powered, public-facing where it counts.

## Features

- Auth
- Create and manage listings
- Public listings

<!-- Screenshot placeholder: add app screenshot here -->

## Local setup

```bash
npm ci
cp .env.example .env.local  # then set Supabase keys + site URL
npm run dev
```

Open `http://localhost:3000/`.

Production-like Cloudflare runtime preview:

```bash
npm run preview
```

## Code quality

- `npm run lint` - ESLint check
- `npm run lint:fix` - ESLint autofix
- `npm run format` - Prettier write
- `npm run format:check` - Prettier check
- `npm run test` - Vitest run
- `npm run build` - Production build

Full verification: `npm run lint && npm run test && npm run build`

Pre-commit runs `lint-staged` on staged files only. JS/TS files get `eslint --fix` then `prettier --write`; JSON/Markdown/CSS/YAML files get `prettier --write`.

## Supabase

- Required public env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (preferred) or `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy fallback)
  - `NEXT_PUBLIC_SITE_URL`
- Server-only env vars:
  - `SUPABASE_SERVICE_ROLE_KEY` for `npm run seed` and `npm run import:ios`
- Set `NEXT_PUBLIC_SITE_URL` to the exact current app origin (`http://localhost:3000` in dev, deployed origin in prod).
- Set Supabase Auth **Site URL** to your production app origin.
- Add Supabase Auth **Redirect URLs** for each allowed `/auth/callback/` origin, including localhost, production, and any preview domains.
- Seed test data with `SUPABASE_SERVICE_ROLE_KEY=... npm run seed` after setting your Supabase URL.
- After schema migrations, regenerate `lib/database.types.ts` so app types stay aligned with Supabase.

## Cloudflare deployment

Main app no longer supports GitHub Pages static hosting. Auth, protected dashboard pages, and listing creation require a real runtime.

This repo targets **Cloudflare Workers + OpenNext** for full Next.js 16 runtime support.

### Required files and scripts

- `open-next.config.ts`
- `wrangler.jsonc`
- `npm run preview`
- `npm run deploy`
- `npm run cf:typegen`

### Cloudflare dashboard / project settings

Use **Workers**, not Cloudflare Pages static hosting, for the main app.

- Framework preset: **None**
- Build command: `npm run deploy`
- Output directory: **none** (OpenNext writes `.open-next` and Wrangler deploys worker + assets)
- Production branch: your normal deploy branch
- Node.js compatibility: enabled by `wrangler.jsonc` via `nodejs_compat`

If you import the repo into **Cloudflare Pages**, do not use the Next.js static preset for the main app. Pages static output cannot support sign-in, protected routes, or create/manage listing flows in this repo.

### Environment variables to add in Cloudflare

Set these before deployment so build and runtime both receive correct values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Optional / local-only:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` if you still rely on the legacy anon key instead of a publishable key
- `SUPABASE_SERVICE_ROLE_KEY` only if you plan to run `npm run seed` from a trusted environment

### Build and deploy flow

```bash
npm ci
npm run deploy
```

For a local production-like check before deploy:

```bash
npm run preview
```

### Supabase auth settings

Set Supabase Auth **Site URL** to your production app origin.

Add every allowed callback origin to Supabase Auth **Redirect URLs**:

- `http://localhost:3000/auth/callback/`
- `https://<your-cloudflare-workers-domain>/auth/callback/`
- `https://<your-custom-domain>/auth/callback/`
- `https://<any-preview-domain>/auth/callback/` for preview deploys

`NEXT_PUBLIC_SITE_URL` must match the deployed origin for each environment. For preview deploys, use preview-specific values instead of reusing the production origin.

### Notes

- Server-rendered dashboard routes use Supabase cookies and require runtime execution.
- Public listing detail pages no longer depend on static export params.
- If a separate static marketing site is needed later, host it separately from the runtime app.

## Seed

- `npm run seed`
- Creates or reuses `seed.listings@example.com`
- Adds 6 sample listings with draft/published mix for local testing

## iOS import

- `npm run import:ios -- --country=ZA --limit=10 --terms=habit tracker,streak tracker,journaling,productivity,to do`
- Fetches Apple iTunes Search API software results (`media=software`, `entity=software`)
- Reuses the seed user/profile bootstrap from `npm run seed`
- Script env loads from local Next env files (`.env.local`, `.env`) via `@next/env`; global shell export not required in local dev
- Maps Apple data into existing `listings` shape: `name`, `platforms=["iOS"]`, `urls.ios`, nullable `website_url`, nullable `description`, `draft`, `is_claimed=false`
- Defaults: `terms=habit tracker,streak tracker,journaling,productivity,to do`, `country=ZA`, `limit=10`
- Reruns are safe for importer-owned rows: existing seed-owned iOS listings update in place by App Store URL and keep their existing slug/status/claimed state; rows owned by another user with the same iOS URL are skipped
- Requires `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`) plus `SUPABASE_SERVICE_ROLE_KEY`
- Optional env overrides: `IOS_IMPORT_TERMS`, `IOS_IMPORT_COUNTRY`, `IOS_IMPORT_LIMIT`
- Verified schema assumptions from repo: `profiles.id` owns `listings.user_id`; `listings` uses `slug`, `platforms`, `urls`, `website_url`, `description`, `status`, `is_claimed`; `status` enum is `draft | published`; insert/update conflict handling should stay in code, not new schema columns
