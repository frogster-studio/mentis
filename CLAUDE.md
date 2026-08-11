# Mentis monorepo

Two apps sharing one Supabase project. **bun only** — never npm, pnpm, or yarn (`bun install`, `bun run`, `bunx`).

```
apps/admin/    # Next.js back-office (Vercel). App details: apps/admin/CLAUDE.md
apps/mobile/   # Expo quiz app (EAS later). App details: apps/mobile/CLAUDE.md
packages/      # future shared packages (none yet — don't create speculatively)
supabase/      # SHARED schema: migrations + config for the hosted project (eu-central-1)
```

Before working inside an app, read its `CLAUDE.md`; each also has a normative `CONTEXT.md` glossary ([CONTEXT-MAP.md](CONTEXT-MAP.md) maps them).

## Commands (repo root)

- `bun run format` — Biome auto-fix, whole repo
- `bun run knip` — drop unused files/exports/deps, then format
- `bun run jscpd` — copy-paste detection report (advisory; not part of `check`)
- `bun run typecheck` / `bun run test` — every workspace
- `bun run check` — all of the above; **every piece of work must end with `check` green**
- Single workspace: `bun run --filter @mentis/admin <script>` / `--filter @mentis/mobile`

Biome and Knip are configured **only at the root** (`biome.json`, `knip.json`) — never add per-app configs or per-app lint scripts. Style: double quotes, 2-space indent, line width 100.

## Database

Migrations live in `supabase/` at the root — never inside an app. Both apps currently query Supabase directly; the decided trajectory is a future `apps/api` that becomes the **sole** database gateway, at which point `supabase/` moves inside it. Until `apps/api` exists, don't route either app through intermediaries.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `frogster-studio/mentis`, driven by the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary — the five canonical roles used verbatim (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context — root `CONTEXT-MAP.md` maps per-app `CONTEXT.md` glossaries and `docs/adr/` directories. See `docs/agents/domain.md`.

### Conventions

Code style and repo hygiene house rules, incl. comment style. See `docs/agents/conventions.md`.
