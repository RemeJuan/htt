## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000/htt/`.

## GitHub Pages

This repo deploys as a Pages **project site** under `/htt`.

GitHub Settings:
- Settings → Pages → Source = **GitHub Actions**

Required repo secrets for the Pages build:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Pages limits:
- no server runtime, server actions, or secret server key
- auth uses browser-side Supabase only
- dashboard/auth routes are static shell pages
- Supabase redirect URL must target `https://<user>.github.io/htt/auth/callback/`
