# Mentis — admin

Back-office for the Mentis Card library: an authenticated web app where editors create, browse, edit, and delete Cards (Quiz, True/False, Anecdote, Did You Know, Riddle). See [CONTEXT.md](CONTEXT.md) for the domain glossary.

Part of the [Mentis monorepo](../../README.md) — `@mentis/admin` workspace.

## Stack

- [Next.js](https://nextjs.org) (App Router) deployed on [Vercel](https://vercel.com)
- [Supabase](https://supabase.com) for Postgres and Storage (accessed server-side only; shared schema lives in [`supabase/`](../../supabase/) at the repo root)
- Tailwind CSS (SKY and ZINC palettes) + [shadcn/ui](https://ui.shadcn.com) with lucide icons
- vitest for tests; Biome and Knip are configured at the monorepo root

## Getting started

```bash
bun install                  # at the repo root
cp .env.example .env.local   # in apps/admin — then fill in the values
bun run dev                  # in apps/admin — http://localhost:3000
```

## Environment variables

All variables are server-side only — none use the `NEXT_PUBLIC_` prefix, so nothing leaks to the browser. Set them in `.env.local` locally and in the Vercel project settings for deployments.

| Variable | What it does |
| --- | --- |
| `SUPABASE_URL` | URL of the Supabase project (e.g. `https://<ref>.supabase.co`). Used by the server to reach Postgres and Storage. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key. Grants full database/storage access, which is why it must stay server-side. Found under Project Settings → API keys. |
| `ALLOWED_EMAILS` | Comma-separated list of editor emails allowed to log in (e.g. `alice@example.com,bob@example.com`). |
| `SHARED_PASSWORD` | The single password shared by all editors. Both the allowlist and this password must match for login to succeed. |
| `SESSION_SECRET` | Random secret used to sign the HTTP-only session cookie. Generate with `openssl rand -base64 32`. Consumed by the auth layer. |

## Scripts (run in `apps/admin`)

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run test` | Run the vitest suite |
| `bun run typecheck` | TypeScript type check (`tsc --noEmit`) |

Formatting, linting, and dead-code checks run from the repo root: `bun run format`, `bun run knip`, `bun run check`.

## Deployment

The app deploys to Vercel from the monorepo with **Root Directory = `apps/admin`** and the default Next.js build settings (bun is auto-detected from `bun.lock`). Every environment variable above must also be set on the Vercel project (Settings → Environment Variables).
