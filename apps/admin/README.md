# Mentis — admin

Back-office for the Mentis Card library: an authenticated web app where editors create, browse, edit, and delete Cards (Quiz, True/False, Anecdote, Did You Know, Riddle). See [CONTEXT.md](CONTEXT.md) for the domain glossary.

Part of the [Mentis monorepo](../../README.md) — `@mentis/admin` workspace.

## Stack

- [Next.js](https://nextjs.org) (App Router) deployed on [Vercel](https://vercel.com)
- [`apps/api`](../api/) for every Card read and write — admin holds no database credentials and never queries Postgres or Storage itself
- [Supabase Auth](https://supabase.com/docs/guides/auth) for editor sign-in, server-side through `@supabase/ssr`
- Request and response shapes from [`@mentis/contracts`](../../packages/contracts/); Tailwind CSS (SKY and ZINC palettes) + [shadcn/ui](https://ui.shadcn.com) with lucide icons
- vitest for tests; Biome and Knip are configured at the monorepo root

`@mentis/contracts` resolves to its TypeScript source through a `paths` mapping in `tsconfig.json`, not the package's `bun` export condition the way `apps/api` does: Turbopack reads tsconfig paths and ignores custom export conditions, and the package's `default` condition points at a `dist/` only ever built inside the api's Docker image.

## Authentication

Editors are Supabase Auth users stamped with `app_metadata.role = "editor"`, created by hand in the Supabase dashboard — admin offers no signup and no password reset. Logging in checks that claim and refuses any account without it, so a signed-in session is always an editor session. Each request to the API forwards the editor's access token as a bearer header, and the API re-verifies it.

## Getting started

```bash
bun install            # at the repo root
cp .env.example .env   # in apps/admin — the committed values are ready to use
bun run dev            # in apps/admin — http://localhost:3000
```

`API_URL` defaults to the api workspace on `http://localhost:3001`, so run `bun run dev` in [`apps/api`](../api/) alongside it — or point `API_URL` at a deployed instance.

## Environment variables

All variables are server-side only — none use the `NEXT_PUBLIC_` prefix, so nothing leaks to the browser. **Admin holds no secrets**: every value below is public by design. Set them in `.env` locally and in the Vercel project settings for deployments.

| Variable | What it does |
| --- | --- |
| `SUPABASE_URL` | URL of the Supabase project. Signs editors in, and is the origin of the public Card Image URLs. |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_…`). Safe to expose; it grants nothing on its own. |
| `API_URL` | Origin of the `apps/api` service every Card read and write goes through. |

## Scripts (run in `apps/admin`)

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run test` | Run the vitest suite |
| `bun run typecheck` | TypeScript type check (`tsc --noEmit`) |

Formatting, linting, and dead-code checks run from the repo root: `bun run format`, `bun run knip`, `bun run check`.

## Deployment

The app deploys to Vercel from the monorepo with **Root Directory = `apps/admin`** and the default Next.js build settings (bun is auto-detected from `bun.lock`). Every environment variable above must also be set on the Vercel project (Settings → Environment Variables), with `API_URL` pointing at the deployed api service.
