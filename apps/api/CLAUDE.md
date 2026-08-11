# Mentis — API gateway (NestJS 11, REST-only)

`@mentis/api` workspace of the Mentis monorepo (bun only — see the root `CLAUDE.md`). It is on its way to being the **sole** database gateway; admin and mobile still query Supabase directly until their cutover slices land. Issues live in `.grilled/issues/` (gitignored), implemented via the `implement-next-issue` loop.

Deliberately **not** a bounded context, so no `CONTEXT.md` and no row in `CONTEXT-MAP.md`: a gateway publishes existing vocabularies rather than owning one. `/admin/*` speaks Card curation (`apps/admin/CONTEXT.md`), `/app/*` speaks Quiz play (`apps/mobile/CONTEXT.md`).

## Commands (run in `apps/api`)

- `bun run dev` — watch mode (bun auto-loads `.env`; `cp .env.example .env` then fill the one secret)
- `bun run typecheck` — `tsc --noEmit`
- `bun run test` — vitest, via SWC (esbuild cannot emit decorator metadata)
- `bun run build` — `tsc` emit to `dist/`; node runs that output in prod, bun never transpiles prod code
- From the repo root: `bun run check` (typecheck + test + knip + format, all workspaces); **every issue must end with `check` green**

## Hard constraints

- **Nine third-party production dependencies, and no more** (plus the workspace `@mentis/contracts`): `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `reflect-metadata`, `rxjs`, `zod`, `helmet`, `@nestjs/throttler`, `@supabase/supabase-js`. No `@nestjs/cli`, class-validator/transformer, `@nestjs/config`/dotenv, `nestjs-zod`, swagger, passport.
- The root Nest module is `RootModule`, never `AppModule`: "app" is reserved surface vocabulary, and `AppModule` is the `/app` surface module (`src/app/app.module.ts`). Surface directories mirror the URL namespaces (`src/admin/`, `src/app/`) as routes arrive.
- Decorator flags live directly in `tsconfig.json` — never move them into a shared base (bun bug oven-sh/bun#6326). `tsconfig.build.json` needs an explicit `rootDir` beside `outDir` (TS 6).
- The service client from `src/supabase.ts` is the only database path, with no per-request user-authed client. RLS owner-scoping is re-implemented as explicit owner filters.
- Every non-2xx body is the `ErrorResponse` envelope from `@mentis/contracts/shared`, emitted by `HttpErrorFilter` and nowhere else.
- Wire casing is camelCase — one aliased select string per endpoint, no ORM.
- `GET /health` stays unguarded and unthrottled: Railway restarts the container on a failed poll.
- Biome and Knip stay root-only. `biome.json` carries one `apps/api/**` override (`unsafeParameterDecoratorsEnabled`, `useImportType: off` — the safe-fix otherwise rewrites injected services to `import type` and erases Nest's DI metadata).

## Structure

```
src/
  app/            # the /app surface: public Quiz play reads
  common/         # cross-cutting spine: ZodValidationPipe, HttpErrorFilter
  health/         # GET /health
  core.module.ts  # global providers: ENV, SUPABASE
  env.ts          # zod-validated config, parsed once at boot
  supabase.ts     # the service client — the only database path
  main.ts         # bootstrap: helmet, CORS allowlist, shutdown hooks
  root.module.ts
test/             # fetch-based e2e (no supertest)
```

## Conventions

- Files kebab-case, Nest suffixes kept (`*.controller.ts`, `*.module.ts`, `*.guard.ts`, `*.pipe.ts`, `*.filter.ts`).
- Tests are `*.spec.ts` co-located in `src/`, e2e is `test/*.e2e-spec.ts` — the two globs vitest includes.
- Request/response schemas live in `@mentis/contracts`, never here; the API validates requests *and* parses its own responses through them.
- `@mentis/contracts` is **source-first**: the `bun` export condition (plus tsc `customConditions` and the vitest alias) serves `src/`. `dist/` is built only inside the Docker image, so `bun run check` never builds anything and stays order-independent.
- `@nestjs/throttler` is installed but wired to nothing until the rate-limiting slice, which is why it sits in `knip.json`'s `ignoreDependencies` — drop that entry when the throttling posture lands.

## Environment

`env.ts` is the whole config surface: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CORS_ORIGINS` (comma-separated, default `""`, parsed to a list), `PORT` (default 3001 — dodges `next dev` on 3000). `NODE_ENV` is deliberately absent; the Dockerfile sets it for dependency perf paths and nothing in our code reads it. `.env.example` carries real public values, so `cp .env.example .env` plus one secret is a full local setup. Any commit that changes env consumption updates `.env.example` in the same commit.
