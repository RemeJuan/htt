# Repo notes

## Commands

- Run from repo root. Lockfile is `package-lock.json`; use `npm`.
- Install: `npm ci`
- Dev: `npm run dev` → `http://localhost:3000/`
- Full verification before handoff unless user scopes narrower: `npm run lint && npm run test && npm run build`
- Focused tests: `npm run test -- tests/unit/...` or `npm run test -- tests/components/...`
- Coverage: `npm run coverage`
- Production-like local runtime: `npm run preview`
- Deploy: `npm run deploy`
- Pre-commit hook runs `npm exec lint-staged`; staged JS/TS files get `eslint --fix` then `prettier --write`, so hooks may rewrite files.

## Runtime / build quirks

- This is single-package Next.js 16 App Router app deployed via OpenNext to Cloudflare Workers, not static export.
- `npm run build` runs `opennextjs-cloudflare build`, not plain `next build`. OpenNext delegates app compilation through `open-next.config.ts` → `npm run build:app`.
- `next.config.ts` intentionally keeps `trailingSlash: true`, `images.unoptimized = true`, and `turbopack.root` pinned to repo root.
- `wrangler.jsonc` deploys `.open-next/worker.js`, serves assets from `.open-next/assets` via `ASSETS`, and enables `nodejs_compat`.
- `.mcp.json` exposes `next-devtools` via `npx -y next-devtools-mcp@latest`.

## Supabase / env

- Public env contract lives in `lib/env.ts`: require `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SITE_URL`, plus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `lib/supabase-server.ts` throws immediately when required public Supabase env vars are missing.
- Auth callback route is `/auth/callback/`; `NEXT_PUBLIC_SITE_URL` must match current origin because callback URLs are built from it.
- Script env loads via `@next/env` in `scripts/lib.mjs`, so local scripts read `.env.local` / `.env` automatically.
- Seed/import scripts require `SUPABASE_SERVICE_ROLE_KEY`; they accept `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`.
- `lib/database.types.ts` is generated schema output. Do not hand-edit.
- `lib/listing-validation.ts` is source of truth for listing slug, URL, platform, and status rules.

## Code map

- `app/` holds route entrypoints. Key roots: `app/layout.tsx`, `app/page.tsx`, `app/dashboard/*`, `app/listings/*`, `app/auth/callback/page.tsx`, `app/api/public-listings/route.ts`.
- `app/api/public-listings/route.ts` is explicitly `force-dynamic`; do not treat public listings API as static.
- `components/app-shell.tsx` wraps every page with `Navbar` and shared max-width layout.
- Keep theme bootstrap behavior aligned across `app/layout.tsx`, `components/theme-provider.tsx`, and `styles/theme.css` (`habit-tracker-theme`, `data-theme`, `data-theme-mode`).
- Reuse `components/ui/*` for loading/error/empty states before adding one-off variants.
- `lib/` holds env, auth, Supabase clients, public-listings helpers, and validation.
- `scripts/seed.mjs`, `scripts/import-ios.mjs`, and `scripts/publish-ios.mjs` share bootstrap helpers from `scripts/lib.mjs`.

## Tests / quality

- Vitest split: unit tests in `tests/unit/**/*.test.ts` run in `node`; component and smoke tests in `tests/components` and `tests/smoke` run in `happy-dom`.
- Component test setup lives in `tests/setup/shared.ts`, `tests/setup/happy-dom.tsx`, and `tests/setup/a11y.ts`.
- Coverage includes `app/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`, `lib/**/*.ts`; excludes `lib/database.types.ts` and `tests/**`.
- ESLint ignores `.next/**`, `.open-next/**`, `out/**`, `build/**`, `coverage/**`, and `next-env.d.ts`.

## Workflow

- Keep `.env.local` out of git.
- Use Conventional Commits.
