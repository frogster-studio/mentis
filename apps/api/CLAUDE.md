# Mentis — API gateway (NestJS 11, REST-only)

`@mentis/api` workspace of the Mentis monorepo (bun only — see the root `CLAUDE.md`). It is on its way to being the **sole** database gateway: admin already goes through it, mobile still queries Supabase directly until its cutover slice lands. Issues live in `.grilled/issues/` (gitignored), implemented via the `implement-next-issue` loop.

Deliberately **not** a bounded context, so no `CONTEXT.md` and no row in `CONTEXT-MAP.md`: a gateway publishes existing vocabularies rather than owning one. `/admin/*` speaks Card curation (`apps/admin/CONTEXT.md`), `/app/*` speaks Quiz play (`apps/mobile/CONTEXT.md`).

## Commands (run in `apps/api`)

- `bun run dev` — watch mode (bun auto-loads `.env`; `cp .env.example .env` then fill the one secret)
- `bun run typecheck` — `tsc --noEmit`
- `bun run test` — vitest, via SWC (esbuild cannot emit decorator metadata)
- `bun run build` — `tsc` emit to `dist/`; node runs that output in prod, bun never transpiles prod code
- From the repo root: `bun run check` (typecheck + test + knip + format, all workspaces); **every issue must end with `check` green**

## Hard constraints

- **Ten third-party production dependencies, and no more** (plus the workspace `@mentis/contracts`): `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `reflect-metadata`, `rxjs`, `zod`, `helmet`, `@nestjs/throttler`, `@supabase/supabase-js`, `jose`. No `@nestjs/cli`, class-validator/transformer, `@nestjs/config`/dotenv, `nestjs-zod`, swagger, passport.
- The root Nest module is `RootModule`, never `AppModule`: "app" is reserved surface vocabulary, and `AppModule` is the `/app` surface module (`src/app/app.module.ts`). Surface directories mirror the URL namespaces (`src/admin/`, `src/app/`) as routes arrive.
- Decorator flags live directly in `tsconfig.json` — never move them into a shared base (bun bug oven-sh/bun#6326). `tsconfig.build.json` needs an explicit `rootDir` beside `outDir` (TS 6).
- The service client from `src/supabase.ts` is the only database path, with no per-request user-authed client. RLS owner-scoping is re-implemented as explicit owner filters.
- Supabase Auth signs access tokens with ES256 asymmetric keys, so JWT verification is local — `jose` against the project JWKS with `iss`/`aud`/`alg` pinned, never a per-request Auth-server call and never the legacy JWT secret. The namespace prefix is the auth boundary: `EditorGuard` on `/admin/*`, `SupabaseUserGuard` on `/app/me/*`, no auth guard on public `/app` reads.
- Every non-2xx body is the `ErrorResponse` envelope from `@mentis/contracts/shared`, emitted by `HttpErrorFilter` and nowhere else.
- Wire casing is camelCase — one aliased select string per endpoint, no ORM.
- Throttling is per-surface guards ordered **after** auth, never a global `APP_GUARD`: only a guard that runs after verification can key a bucket on the JWT `sub`. One bucket per tier per caller — public reads and the draw key on `req.ip` (hence `trust proxy 2` — Railway fronts the container with two hops, and trusting one reads the edge's own address), `/admin/*` and `/app/me/*` share one `sub`-keyed bucket.
- `GET /health` stays unguarded and unthrottled: Railway restarts the container on a failed poll.
- The API speaks **JSON only**: `NEST_OPTIONS` turns off Nest's parsers wholesale and `bootstrap.ts` registers json alone, capped at 64 kb against the `.max(200)` push batch caps. Never create the app without `NEST_OPTIONS` — that silently restores Express's unchosen 100 kb wall. A non-JSON body reaches the pipe as `undefined` and 400s; nothing sends one (admin parses FormData locally, image bytes never touch the API — ADR 0001).
- Biome and Knip stay root-only. `biome.json` carries one `apps/api/**` override (`unsafeParameterDecoratorsEnabled`, `useImportType: off` — the safe-fix otherwise rewrites injected services to `import type` and erases Nest's DI metadata).

## Structure

```
src/
  admin/          # the /admin surface: Card curation, EditorGuard-bound
  app/            # the /app surface: public Quiz play reads
  auth/           # SupabaseUserGuard (401) and EditorGuard (403), plus the project JWKS
  common/         # cross-cutting spine: ZodValidationPipe, HttpErrorFilter, the rate-limit tiers
  health/         # GET /health
  bootstrap.ts    # helmet, CORS allowlist, trust proxy, json body cap — shared with the e2e suite
  core.module.ts  # global providers: ENV, SUPABASE, JWKS
  env.ts          # zod-validated config, parsed once at boot
  supabase.ts     # the service client — the only database path
  main.ts         # boot: create, configure, shutdown hooks, listen
  root.module.ts
test/             # fetch-based e2e (no supertest)
```

## Conventions

- Files kebab-case, Nest suffixes kept (`*.controller.ts`, `*.module.ts`, `*.guard.ts`, `*.pipe.ts`, `*.filter.ts`).
- Tests are `*.spec.ts` co-located in `src/`, e2e is `test/*.e2e-spec.ts` — the two globs vitest includes.
- Request/response schemas live in `@mentis/contracts`, never here; the API validates requests *and* parses its own responses through them.
- `@mentis/contracts` is **source-first**: the `bun` export condition (plus tsc `customConditions` and the vitest alias) serves `src/`. `dist/` is built only inside the Docker image, so `bun run check` never builds anything and stays order-independent.
- e2e tests build their app through `bootstrap.ts` when the express-level config is part of what they prove (body cap, `X-Forwarded-For` buckets), so the suite can never drift from `main.ts`.

## Environment

`env.ts` is the whole config surface: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CORS_ORIGINS` (comma-separated, default `""`, parsed to a list), `PORT` (default 3001 — dodges `next dev` on 3000). `NODE_ENV` is deliberately absent; the Dockerfile sets it for dependency perf paths and nothing in our code reads it. `.env.example` carries real public values, so `cp .env.example .env` plus one secret is a full local setup. Any commit that changes env consumption updates `.env.example` in the same commit.
