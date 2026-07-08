# Mentis

Back-office for the Mentis Card library: an authenticated web app where allowlisted editors create, browse, edit, and delete Cards (Quiz, True/False, Anecdote, Did You Know, Riddle). See [docs/prds/0001-card-back-office.md](docs/prds/0001-card-back-office.md) for the full product spec and [CONTEXT.md](CONTEXT.md) for the domain glossary.

## Stack

- [Next.js](https://nextjs.org) (App Router) deployed on [Vercel](https://vercel.com)
- [Supabase](https://supabase.com) for Postgres and Storage (accessed server-side only)
- Tailwind CSS (SKY and ZINC palettes) + [shadcn/ui](https://ui.shadcn.com) with lucide icons
- vitest for tests, Biome for lint/format, Knip for dead-code detection

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
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

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Run the vitest suite |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`) |
| `npm run lint` | Biome check with auto-fix (`biome check --write`) |
| `npm run knip` | Detect unused files, exports, and dependencies |

## Deployment

The app deploys to Vercel from this repository with the default Next.js build settings. Every environment variable above must also be set on the Vercel project (Settings → Environment Variables).
