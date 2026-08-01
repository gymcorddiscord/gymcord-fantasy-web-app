# Gymcord Fantasy

A fantasy gymnastics web app for NCAA women's artistic gymnastics.

> **Status:** Phase 1 foundation. Auth (via Discord) + a read-only gymnast catalog. Leagues, lineups, and trades are not built yet.

---

## What's in this folder

```
gymcord-fantasy-web-app/
├── frontend/                  React app (Vite) — the only thing that gets deployed
├── db/                         SQL to set up the Supabase (Postgres) schema + seed data
├── .github/workflows/          GitHub Actions: builds & deploys frontend/ to GitHub Pages
└── README.md                   (this file)
```

There's no custom backend. **Supabase** provides the Postgres database, authentication (Discord OAuth), and an auto-generated REST API — the frontend talks to it directly.

---

## One-time setup

You'll need:
- **Node.js 20 or later** — https://nodejs.org
- A **Supabase** project (free tier) — https://supabase.com
- A **Discord OAuth application** — https://discord.com/developers/applications

### 1. Install dependencies

```bash
npm run install-all
```

### 2. Set up Supabase

1. Create a project at supabase.com.
2. In the Supabase SQL Editor, run `db/schema.sql`, then `db/seed-gymnasts.sql`.
3. Go to Authentication → Providers → Discord, enable it, and copy the Redirect URL Supabase shows you.
4. In your Discord application (developer portal) → OAuth2 → Redirects, paste that URL.
5. Copy your Discord app's Client ID and Client Secret into Supabase's Discord provider settings.
6. In Supabase → Project Settings → API, copy the **Project URL** and **anon public key**.

### 3. Configure the frontend

```bash
cp frontend/.env.example frontend/.env.local
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the values from step 2.6.

---

## Running locally

```bash
npm run dev
```

Open http://localhost:5173.

---

## What's been built so far

- [x] Project structure
- [x] Supabase schema (profiles, NCAA teams, gymnasts, feedback)
- [x] Seed data for NCAA teams and a starter gymnast pool
- [x] Discord OAuth sign-in (Supabase Auth)
- [x] Frontend: Landing, Login, Register, Home, Gymnasts pages
- [x] Persistent feedback/bug-report button on every page
- [ ] Leagues + fantasy teams (next)
- [ ] Drafting, lineups, and scores
- [ ] Deployment to GitHub Pages (workflow exists, needs repo secrets configured — see below)

See the PRD (`gymcord-fantasy-prd.md`) for the full feature set.

### Gymnast score views

Gymnast scores are viewable/calculable five ways, per apparatus: **Average**, **Median**, **Most Recent**, **High**, and **NQS** (National Qualifying Score — the NCAA's official per-event qualifying formula: 3 highest away + 3 highest home scores that season, drop the highest of those six, average the remaining five). See PRD Section 10.9 for full definitions.

---

## Deploying to GitHub Pages

The `.github/workflows/deploy.yml` workflow builds and deploys `frontend/` automatically on every push to `main`. Two one-time steps in the GitHub repo settings (not something this workflow can do for you):

1. **Settings → Pages → Source:** set to "GitHub Actions".
2. **Settings → Secrets and variables → Actions:** add repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as your `.env.local`) so the build has them.

If the repo is ever renamed, update `base` in `frontend/vite.config.ts` to match.
