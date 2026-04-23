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
cp .env.example .env.local  # then set Supabase keys
npm run dev
```

Open `http://localhost:3000/`.

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

- Use a public Supabase URL and publishable/anon key only.
- Update Supabase auth redirect URLs for your local and deployed `/auth/callback/` paths.
- Seed test data with `SUPABASE_SERVICE_ROLE_KEY=... npm run seed` after setting your Supabase URL.

## Seed

- `npm run seed`
- Creates or reuses `seed.listings@example.com`
- Adds 6 sample listings with draft/published mix for local testing
