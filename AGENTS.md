# Repo notes

## Commands

- Run from repo root.
- Install: `npm ci`
- Dev: `npm run dev` then open `http://localhost:3000/htt/`
- Testing required: run relevant tests for every change; use `npm run lint && npm run test && npm run build` before handoff unless user explicitly scopes verification narrower.
- Full verification: `npm run lint && npm run test && npm run build`
- Focused tests: `npm run test -- tests/unit/...` or `npm run test -- tests/components/...`
- Coverage: `npm run coverage`
- Pre-commit runs `npm exec lint-staged`; staged JS/TS files get `eslint --fix` then `prettier --write`, so hooks may rewrite files.

## Framework / deploy quirks

- Next.js 16 App Router with static export. `next.config.ts` sets `output: "export"`, `basePath: "/htt"`, `assetPrefix: "/htt"`, `trailingSlash: true`, `images.unoptimized = true`, and `turbopack.root` to repo root.
- Route/path changes must preserve `/htt` prefix. Auth callback route is `/htt/auth/callback/`.
- Trust CI over README deploy prose: `.github/workflows/pages.yml` builds `out/` on Node 20 and deploys to GitHub Pages.
- `.mcp.json` exposes `next-devtools` via `npx -y next-devtools-mcp@latest`.

## Supabase / data

- Public env contract lives in `lib/env.ts`: require `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `lib/supabase-server.ts` throws immediately when those public env vars are missing.
- `scripts/seed.mjs` also requires `SUPABASE_SERVICE_ROLE_KEY`; it accepts `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`.
- Seed script creates/reuses `seed.listings@example.com`, upserts `profiles`, then upserts 6 sample `listings` by slug.
- `lib/database.types.ts` is generated schema output. Do not hand-edit.
- `lib/listing-validation.ts` is source of truth for listing slug, URL, and status rules.

## Code map

- `app/` route entrypoints.
- `components/app-shell.tsx` wraps every page with `Navbar` and shared max-width layout.
- `app/layout.tsx` owns metadata, `/htt/logo.png` icons, and pre-hydration theme bootstrap.
- Keep `habit-tracker-theme`, `data-theme`, and `data-theme-mode` behavior aligned between `app/layout.tsx`, `components/theme-provider.tsx`, and `styles/theme.css`.
- `lib/` holds env, auth, Supabase clients, listings helpers, and validation.
- Reuse `components/ui/*` for loading/error/empty states before adding one-off variants.

## Tests

- Vitest split: unit tests in `tests/unit/**/*.test.ts`, component/smoke tests in `tests/components` and `tests/smoke`.
- Component tests run in `happy-dom` and mock `next/link` in `tests/setup/happy-dom.tsx`.
- Coverage includes `app/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`, `lib/**/*.ts`; excludes `lib/database.types.ts` and `tests/**`.

## Instruction files

- `CLAUDE.md` only points back to this file. Keep repo-specific agent guidance here.
- Keep `.env.local` out of git.
- Use Conventional Commits.
