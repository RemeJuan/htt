## htt

Minimal Next.js app for Supabase-backed auth/dashboard pages.

## Local setup

```bash
npm ci
npm run dev
```

Copy `.env.example` to `.env.local` and set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Open `http://localhost:3000/htt/`.

## Supabase

- Use a public Supabase URL and publishable/anon key only.
- Update Supabase auth redirect URLs for your local and deployed `/htt/auth/callback/` paths.
- Seed test data with `SUPABASE_SERVICE_ROLE_KEY=... npm run seed` after setting your Supabase URL.

## Seed

- `npm run seed`
- Creates or reuses `seed.listings@example.com`
- Adds 6 sample listings with draft/published mix for local testing

## Deploy

Deploy on Vercel as a Next.js project.
Set the same Supabase env vars in Vercel project settings, then deploy; no extra Vercel config is required.
