# Repo Notes

- Next.js 16.2.4 App Router. Read `node_modules/next/dist/docs/` before changing Next behavior.
- Run from repo root. `next.config.ts` sets `turbopack.root` to the repo dir, uses `basePath: "/htt"`, `assetPrefix: "/htt"`, `trailingSlash: true`, and static export.
- npm scripts in `package.json`: `dev`, `build`, `start`, `lint`, `lint:fix`, `seed`. No test script; verify with `npm run lint` then `npm run build`.
- Pre-commit runs `lint-staged` on staged files and may rewrite them.
- `.mcp.json` exposes `next-devtools` via `npx next-devtools-mcp@latest`.

## App / data gotchas

- Public Supabase only. Browser/server code expects `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `lib/supabase-server.ts` throws if missing.
- `scripts/seed.mjs` also needs `SUPABASE_SERVICE_ROLE_KEY` and a public Supabase URL.
- Local app URL is `http://localhost:3000/htt/`; Supabase auth callback path is `/htt/auth/callback/`.
- `app/layout.tsx` owns theme bootstrap. Keep `habit-tracker-theme` and `data-theme` / `data-theme-mode` aligned with `components/theme-provider.tsx` and `styles/theme.css`.
- `lib/database.types.ts` is generated Supabase schema. Regenerate on schema changes; do not hand-edit field names.
- `lib/listing-validation.ts` is the source of truth for listing slug/url/status rules.
- Reuse `components/ui/*` for loading/error/empty states before adding one-off variants.

## Workflow

- `app/` is route entrypoints, `components/` shared UI, `lib/` Supabase/helpers.
- `scripts/seed.mjs` creates/reuses `seed.listings@example.com` and upserts sample profiles/listings.
- Static export lands in `out/`; `.github/workflows/pages.yml` deploys that artifact to GitHub Pages with Supabase env secrets.
- Keep `.env.local` out of git.
- Split commits by logical change. Use Conventional Commits. Stage whole files when practical.
