# Mentis

Monorepo for **Mentis**, a French general-knowledge quiz product: a mobile quiz app ("Cash ou Carré") and the back-office that curates its content, sharing one Supabase project.

## Layout

```
apps/
  admin/     # Next.js back-office — editors curate the Card library (deployed on Vercel)
  mobile/    # Expo app (iOS/Android/Web) — the quiz game itself (EAS builds)
packages/    # future shared packages (none yet)
supabase/    # shared database: migrations + CLI config for the hosted project
```

Each app has its own `README.md` / `CLAUDE.md` with app-specific details, and its own `CONTEXT.md` domain glossary (see [CONTEXT-MAP.md](CONTEXT-MAP.md)).

## Tooling

Everything runs with **[bun](https://bun.sh)** — no npm, pnpm, or yarn. Formatting and linting are [Biome](https://biomejs.dev), dead-code detection is [Knip](https://knip.dev); both are configured once at the root and cover every workspace.

## Getting started

```bash
bun install                # once, at the repo root

cd apps/admin && bun run dev     # back-office on http://localhost:3000
cd apps/mobile && bun run start  # Expo dev server
```

## Root commands

| Command | What it does |
| --- | --- |
| `bun run format` | Biome check + auto-fix on the whole repo |
| `bun run knip` | Remove unused files/exports/deps, then format |
| `bun run typecheck` | `tsc --noEmit` in every workspace |
| `bun run test` | vitest in every workspace |
| `bun run check` | typecheck + test + knip — **must be green before any commit** |

Run a single workspace's script with `bun run --filter @mentis/admin <script>` (packages: `@mentis/admin`, `@mentis/mobile`).

## Database

Both apps talk to the same hosted Supabase project (eu-central-1). Migrations and the CLI link live in [supabase/](supabase/) at the root — run `supabase` CLI commands from here. A future `apps/api` is planned to become the sole database gateway; the schema moves into it when that happens.

## CI

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs the non-mutating equivalents (typecheck, `biome ci`, tests, `knip`) on every push and PR to `main`.
