# Mentis — admin

Back-office shell for Mentis: an authenticated web app that today holds nothing but the login gate and an empty landing page. It will grow into the quiz-content back-office.

Part of the [Mentis monorepo](../../README.md) — `@mentis/admin` workspace.

## Stack

- [Next.js](https://nextjs.org) (App Router) deployed on [Vercel](https://vercel.com)
- [Supabase Auth](https://supabase.com/docs/guides/auth) for editor sign-in, server-side through `@supabase/ssr`
- Tailwind CSS (SKY and ZINC palettes); vitest for tests; Biome and Knip are configured at the monorepo root

## Authentication

Editors are Supabase Auth users stamped with `app_metadata.role = "editor"`, created by hand in the Supabase dashboard — admin offers no signup and no password reset. Logging in checks that claim and refuses any account without it, so a signed-in session is always an editor session. The proxy refreshes the session and keeps every page behind the login gate.

## Getting started

```bash
bun install            # at the repo root
cp .env.example .env   # in apps/admin — the committed values are ready to use
bun run dev            # in apps/admin — http://localhost:3000
```

## Environment variables

All variables are server-side only — none use the `NEXT_PUBLIC_` prefix, so nothing leaks to the browser. **Admin holds no secrets**: every value below is public by design. Set them in `.env` locally and in the Vercel project settings for deployments.

| Variable | What it does |
| --- | --- |
| `SUPABASE_URL` | URL of the Supabase project that signs editors in. |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_…`). Safe to expose; it grants nothing on its own. |

## Scripts (run in `apps/admin`)

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run test` | Run the vitest suite |
| `bun run typecheck` | TypeScript type check (`tsc --noEmit`) |

Formatting, linting, and dead-code checks run from the repo root: `bun run format`, `bun run knip`, `bun run check`.

## Deployment

Vercel's Git integration cannot deploy a private organization repo on the Hobby plan, so admin ships from GitHub Actions (`.github/workflows/ci.yml`) with a Vercel token, path-filtered to the files it depends on. Both environment variables above must also be set on the Vercel project (Settings → Environment Variables).
