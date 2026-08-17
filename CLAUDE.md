# Mentis monorepo

Three apps sharing one Supabase project. **bun only** — never npm, pnpm, or yarn (`bun install`, `bun run`, `bunx`).

```
apps/admin/          # Next.js back-office (Vercel). App details: apps/admin/CLAUDE.md
apps/api/            # NestJS REST gateway (Railway later). App details: apps/api/CLAUDE.md
apps/api/supabase/   # SHARED schema: migrations + config for the hosted project (eu-central-1)
apps/mobile/         # Expo quiz app (EAS later). App details: apps/mobile/CLAUDE.md
packages/contracts/  # @mentis/contracts — zod request/response schemas the API publishes
```

Before working inside an app, read its `CLAUDE.md`. Admin and mobile each also have a normative `CONTEXT.md` glossary ([CONTEXT-MAP.md](CONTEXT-MAP.md) maps them); the API deliberately has none — it publishes both vocabularies and owns neither.

## Commands (repo root)

- `bun run format` — Biome auto-fix, whole repo
- `bun run knip` — drop unused files/exports/deps, then format
- `bun run typecheck` / `bun run test` — every workspace
- `bun run check` — all of the above; **every piece of work must end with `check` green**
- Single workspace: `bun run --filter @mentis/admin <script>` (also `@mentis/api`, `@mentis/mobile`, `@mentis/contracts`)

Biome and Knip are configured **only at the root** (`biome.json`, `knip.json`) — never add per-app configs or per-app lint scripts. Style: double quotes, 2-space indent, line width 100.

## Database

Migrations live in `apps/api/supabase/` — the gateway owns the schema, and every Supabase CLI command runs from `apps/api/` (the CLI searches upward for `supabase/config.toml` and never descends, so the repo root does not work). `apps/api` is the sole database gateway: admin and mobile both reach the data through it, and neither holds a database key. Mobile still uses `@supabase/supabase-js` for **auth only** (sign-in, session, token refresh). The schema is a single init migration, born locked — RLS on every table, zero policies, privileges for `service_role` alone ([ADR 0003](docs/adr/0003-database-admits-only-the-api.md)).

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `frogster-studio/mentis`, driven by the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary — the five canonical roles used verbatim (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context — root `CONTEXT-MAP.md` maps per-app `CONTEXT.md` glossaries and `docs/adr/` directories. See `docs/agents/domain.md`.

### Conventions

Code style and repo hygiene house rules, incl. comment style. See `docs/agents/conventions.md`.
