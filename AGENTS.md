# Repo Notes

- Next.js 16.2.4 App Router app. Read `node_modules/next/dist/docs/` before changing framework behavior.
- Use `npm` here. Root scripts: `npm run dev`, `npm run build`, `npm run lint`.
- No test script exists. Use `npm run lint` and `npm run build` for focused verification.
- Root `next.config.ts` sets `turbopack.root` to the repo dir; run from repo root.
- App entrypoints live under `app/`; shared UI lives in `components/`; Supabase helpers/types live in `lib/`.
- `app/layout.tsx` owns the theme bootstrap and wraps the app with `ThemeProvider` and `AppShell`. Keep the `habit-tracker-theme` storage key and `data-theme` / `data-theme-mode` contract in sync with `components/theme-provider.tsx` and `styles/theme.css`.
- `lib/supabase.ts` throws unless `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set. `/.env.local.example` only documents those two vars.
- `lib/database.types.ts` is the generated Supabase schema shape. Update it with schema changes; do not hand-wave field names.
- `lib/listing-validation.ts` is the source of truth for listing slug/url/status checks.
- `components/ui/*` is the shared state shell used by loading/error/empty states. Reuse it before adding new one-off variants.
- Keep `.env.local` out of git. `.gitignore` already excludes env files, `.next/`, `out/`, `build/`, and `coverage/`.

## Commit Rules

- Split commits by logical change; avoid mixed commits.
- Use Conventional Commits.
- Prefer whole-file staging.
- Do not leave the tree in a broken intermediate state.
