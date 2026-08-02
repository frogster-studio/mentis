# Minimal NestJS on bun: deps, vitest, Docker for Railway

Research for issue #5 (part of #2, blocks #8). Date: 2026-08-02. Primary sources: docs.nestjs.com
(raw markdown from `nestjs/docs.nestjs.com`), bun.sh/docs, docs.railway.com, npm registry,
supabase.com/docs. Exact versions verified against the npm registry on the research date.

## TL;DR

- **NestJS 11** (latest stable `11.1.28`; v12 exists only as `12.0.0-alpha.5` on the `next` tag).
  REST-only needs exactly three `@nestjs/*` runtime packages + `reflect-metadata` + `rxjs`.
- **bun for dev, node for prod.** Develop with `bun --watch src/main.ts` (no `@nestjs/cli`, no
  webpack, no ts-node), build with plain `tsc`, run `node dist/main.js` in the container.
- **No `class-validator`/`class-transformer`, no `nestjs-zod`, no `@nestjs/config`.** One ~20-line
  hand-rolled `ZodValidationPipe` + one zod-validated `env.ts`. Schemas come from
  `packages/contracts` when it exists.
- **Vitest works with one config file**: `unplugin-swc` + `@swc/core` (vitest's default esbuild
  transform does not emit decorator metadata; SWC does).
- **Security baseline**: `helmet` (zero-dep) + built-in `enableCors` (Expo-web origin only) +
  `@nestjs/throttler` (zero-dep, Railway has no edge rate limiting) + two tiny guards
  (shared-secret for the BFF surface, Supabase `getClaims()` for the mobile surface).
- **Docker**: multi-stage — `oven/bun:1` to install/build, `node:24-alpine` (current LTS) to run,
  non-root `node` user, listen on `0.0.0.0:$PORT` (Railway injects `PORT`).

---

## 1. Version + exact dependency list

Latest stable is **`11.1.28`** across `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`,
`@nestjs/testing` (npm dist-tag `latest`, checked 2026-08-02). NestJS 11 ships **Express v5** by
default (`@nestjs/platform-express@11.1.28` depends on `express@5.2.1`). NestJS 12 is pre-release —
do not use.

### `apps/api/package.json` — dependencies

| Package                   | Version     | Why                                                        |
| ------------------------- | ----------- | ---------------------------------------------------------- |
| `@nestjs/common`          | `^11.1.28`  | decorators, pipes, guards                                   |
| `@nestjs/core`            | `^11.1.28`  | DI container, NestFactory                                   |
| `@nestjs/platform-express`| `^11.1.28`  | HTTP adapter (brings `express@5`, `cors` for `enableCors`)  |
| `reflect-metadata`        | `^0.2.2`    | required peer for decorator metadata                        |
| `rxjs`                    | `^7.8.2`    | required peer                                               |
| `zod`                     | `^4.4.3`    | request + env validation (same major as `apps/admin`)       |
| `helmet`                  | `^8.3.0`    | security headers; **zero transitive deps**                  |
| `@nestjs/throttler`       | `^6.5.0`    | rate limiting; first-party, **zero runtime deps**           |
| `@supabase/supabase-js`   | `^2.110.1`  | Supabase JWT verification (`auth.getClaims`) now; the DB gateway client later anyway |

### devDependencies

| Package           | Version     | Why                                                   |
| ----------------- | ----------- | ------------------------------------------------------ |
| `typescript`      | `~6.0.3`    | match repo                                             |
| `@types/node`     | `^24`       | match the node 24 runtime container                    |
| `@types/express`  | `^5`        | `NestExpressApplication` typings (`app.set(...)`)      |
| `vitest`          | `^4.1.10`   | match repo standard                                    |
| `unplugin-swc`    | `^1.5.9`    | SWC transform for vitest (decorator metadata)          |
| `@swc/core`       | `^1.15.47`  | peer of `unplugin-swc`                                 |
| `@nestjs/testing` | `^11.1.28`  | `Test.createTestingModule` for unit/e2e                |

### Deliberately skipped (the commonly-added ones)

- **`@nestjs/cli`, webpack, ts-node, ts-loader, tsconfig-paths, `@swc/cli`** — bun runs TS directly
  in dev; `tsc` emits for prod. The Nest CLI only buys generators and a build wrapper.
- **`class-validator`, `class-transformer`** — replaced by zod. They are *optional* peers of
  `@nestjs/common`; as long as Nest's `ValidationPipe`/`ClassSerializerInterceptor` are never
  imported, they are never `require`d. Don't install them.
- **`nestjs-zod`** — current `5.5.0` does now support zod 4 (`peers: zod ^3.25 || ^4`) and its
  `@nestjs/swagger` peer is optional. But its value is `createZodDto` + OpenAPI generation. For a
  REST-only API with schemas imported from `packages/contracts`, a hand-rolled pipe is ~20 lines
  (§3). Revisit only if OpenAPI docs become a requirement.
- **`@nestjs/config` + dotenv** — bun auto-loads `.env` in dev; Railway injects env vars in prod.
  A zod-validated `env.ts` is smaller and fails fast (§3).
- **`@nestjs/swagger`, `@nestjs/mapped-types`** — no OpenAPI consumer; mapped-types is a
  class-validator companion.
- **passport, `@nestjs/passport`, `@nestjs/jwt`, `jsonwebtoken`, `jose`** — two tiny guards cover
  both surfaces (§5); Supabase JWT verification rides on `supabase-js` which the API needs anyway
  as the future sole DB gateway.
- **`cors` (standalone), `compression`, `cookie-parser`, `@nestjs/terminus`,
  `@nestjs/microservices`, `@nestjs/websockets`** — CORS is built into the adapter
  (`app.enableCors`); JWT lives in the `Authorization` header (no cookies); a `/health` controller
  is 5 lines; no microservices/WS transport.
- **`supertest` + `@types/supertest`** — e2e via `app.listen(0)` + global `fetch` (native in node
  ≥18 and bun) needs zero extra deps. supertest stays the docs-blessed alternative if in-process
  testing is preferred.

## 2. Runtime: bun everywhere vs bun-dev/node-prod

**Recommendation: develop and package-manage with bun; compile with `tsc`; run node LTS in the
container.**

Facts (primary sources):

- Bun supports `emitDecoratorMetadata` since v1.0.3, which is what makes NestJS work on `bun run`
  at all (bun blog v1.0.3: "dramatically improves Nest.js support").
- **Open gotcha:** [oven-sh/bun#6326](https://github.com/oven-sh/bun/issues/6326) — bun does *not*
  emit decorator metadata when `experimentalDecorators`/`emitDecoratorMetadata` are only inherited
  via tsconfig `extends`. Still **open** as of 2026-08-02 (fix PR #34496 also open). Consequence:
  declare both flags **directly in `apps/api/tsconfig.json`**, never in a shared base config, and
  never introduce a root base tsconfig that `apps/api` relies on for these flags.
- Watch mode: `bun --watch src/main.ts` restarts the process on change — that is the whole dev
  loop; Nest's own HMR/webpack machinery is unnecessary.
- Bundling Nest with `bun build` hits Nest's optional-dependency conditional requires
  (`@nestjs/microservices`, `@nestjs/websockets`, `class-validator`, `class-transformer`) — it
  needs an `--external` list and has community-reported rough edges
  ([oven-sh/bun#4803](https://github.com/oven-sh/bun/issues/4803)). Avoid bundling; `tsc` emit +
  `node_modules` is the boring path.

Why node in the container rather than `oven/bun` as runtime:

1. **Decorator metadata comes from `tsc` at build time**, not from bun's transpiler at runtime —
   the entire class of bun-transpiler metadata bugs (#6326 etc.) is compiled away before prod.
2. Nest 11 + Express 5 CI runs against node; node LTS is the zero-surprise runtime for the
   Express-based HTTP stack (bun's `node:http` is a compat layer).
3. Image sizes are comparable (`node:24-alpine` vs `oven/bun`), so bun-as-runtime buys startup
   speed we don't need while adding runtime-compat risk.
4. The monorepo stays bun-only per CLAUDE.md — node exists *only inside the container image*;
   every human/CI command remains `bun ...`.

Dev/prod parity caveat (accepted): dev runs bun's transpiler, prod runs tsc output on node. The
e2e tests run through vitest on node with the SWC transform, so the prod-shaped path is what CI
exercises.

### tsconfig sketch

```jsonc
// apps/api/tsconfig.json — flags DIRECTLY here (bun #6326: do not rely on extends)
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "outDir": "dist",
    "noEmit": true
  }
}
```

```jsonc
// apps/api/tsconfig.build.json — tsc handles extends fine; only bun's transpiler doesn't
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "noEmit": false },
  "include": ["src"],
  "exclude": ["src/**/*.spec.ts", "test"]
}
```

No `"type": "module"` in package.json → `nodenext` emits CJS, which is Nest 11's happy path.
Do **not** add `@types/bun` — keeps `Bun.*` globals out so the code stays node-portable.

## 3. Validation + config: zod, hand-rolled

### Request validation — hand-rolled pipe, not `nestjs-zod`

`packages/contracts` will export plain zod schemas. Binding them per-route needs only:

```ts
// src/common/zod-validation.pipe.ts
import { BadRequestException, type PipeTransform } from "@nestjs/common";
import { type ZodType, z } from "zod";

export class ZodValidationPipe<T extends ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(z.treeifyError(result.error));
    }
    return result.data;
  }
}
```

```ts
@Post()
create(@Body(new ZodValidationPipe(createQuizSchema)) dto: CreateQuiz) { ... }
```

That is the entire integration — full inference via `z.infer`, contracts stay framework-free, and
there is no dependency whose release cadence has to track both Nest majors and zod majors.
`nestjs-zod@5.5.0` would work (zod-4 peer support landed; swagger peer optional) but earns its keep
only when OpenAPI generation is wanted.

Express 5 note: the default query parser changed from `qs` to `simple` (no nested objects/arrays
in query strings). Fine for this API; if nested query params are ever needed:
`app.set("query parser", "extended")` (NestJS 11 migration guide).

### Env — zod module, not `@nestjs/config`

`@nestjs/config` is dotenv + a stringly-typed `ConfigService`. Here, dotenv is redundant twice
over: **bun auto-loads `.env` in dev**, and **Railway injects real env vars in prod**. A tiny
module is leaner and typed:

```ts
// src/env.ts — parsed once at boot; crash-fast on misconfiguration
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(3000),
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  ADMIN_API_SECRET: z.string().min(32), // shared with the Next BFF
  CORS_ORIGINS: z.string().default(""), // comma-separated Expo-web origin(s)
});

export type Env = z.infer<typeof envSchema>;
export const ENV = Symbol("ENV");
export const loadEnv = (): Env => envSchema.parse(process.env);
```

Provide `{ provide: ENV, useValue: loadEnv() }` in `AppModule` so tests can override it via DI.
When `packages/contracts` lands, the schema can move there if the BFF wants to share it.

## 4. Vitest instead of jest

The NestJS docs themselves document vitest (recipes/swc): vitest's default esbuild transform
strips types but **cannot emit decorator metadata**, so Nest DI breaks without SWC. Required:
`vitest`, `unplugin-swc`, `@swc/core` (the docs also list `@vitest/coverage-v8` — skip it; root
`check` doesn't gate coverage).

One config, unit + e2e together (the docs split them; a single small API doesn't need to):

```ts
// apps/api/vitest.config.ts
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
  },
  plugins: [
    // vitest's esbuild transform can't emit decorator metadata; SWC can.
    swc.vite({ module: { type: "es6" } }),
  ],
});
```

No `globals: true` (explicit `import { describe, it, expect } from "vitest"` — no ambient-types
juggling), no path aliases (plain relative imports), no `.swcrc` (the inline `module` option
exists precisely to avoid one, per the Nest docs). E2e without supertest:

```ts
const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
const app = moduleRef.createNestApplication();
await app.listen(0);
const res = await fetch(`${await app.getUrl()}/health`);
expect(res.status).toBe(200);
await app.close();
```

Note: `vitest` runs on node even in a bun repo (`bun run test` executes the vitest CLI), which is
exactly what we want — tests exercise the prod runtime family, not bun's transpiler.

## 5. Security baseline (two surfaces, minimal deps)

Surfaces: **admin routes** called only by the Next BFF server-to-server; **mobile routes** public
on the internet but requiring a Supabase JWT.

| Concern | Verdict | Rationale |
| --- | --- | --- |
| `helmet` | **Yes** | `8.3.0` has zero deps; for a JSON API the wins are `X-Content-Type-Options: nosniff`, restrictive defaults, and removal of `X-Powered-By`. One line, nothing to maintain. |
| CORS | **Built-in, allowlist only** | `app.enableCors({ origin: corsOrigins })` with only the Expo-web origin(s) from env. The BFF (server-to-server) and native mobile apps never send CORS preflights — no wildcard, no credentials mode. Empty allowlist in prod until Expo web ships. |
| `@nestjs/throttler` | **Yes, global + generous** | First-party, zero runtime deps. Railway has no built-in WAF/rate limiting, and the mobile surface is internet-reachable; a global `ThrottlerGuard` (e.g. 120 req/60s per IP) caps dumb floods and credential-stuffing against JWT parsing. Requires `app.set("trust proxy", 1)` behind Railway's edge proxy so per-IP buckets see real client IPs. In-memory storage is per-instance — fine at one replica; swap in a redis storage adapter only if the service scales horizontally. |
| Admin surface auth | **Shared-secret guard** | `AdminGuard` compares an `x-internal-key` header against `ADMIN_API_SECRET` with `crypto.timingSafeEqual`. The secret lives in Railway + the BFF's Vercel env. No passport machinery for a single static credential. (Defense-in-depth; the routes are still on the public internet — Railway private networking is not in play from Vercel.) |
| Mobile surface auth | **Supabase JWT guard** | `SupabaseAuthGuard` extracts the bearer token and calls `supabase.auth.getClaims(token)` — supabase-js verifies asymmetric JWTs locally against the project JWKS (`https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`) with caching/rotation handled for us (Supabase's documented recommendation). Prerequisite: project on asymmetric signing keys (JWKS), not the legacy HS256 secret. |
| Misc hardening | Free | `app.enableShutdownHooks()` (graceful SIGTERM on Railway redeploys); Express 5's default 100kb JSON body limit is a sane cap — leave it; deny-by-default via a global guard with an explicit `@Public()` decorator on `/health`. |

Not needed: `compression` (CPU for nothing at this scale), csurf (no cookies), `express-rate-limit`
(throttler is the Nest-native equivalent), API-gateway products (Railway edge + this baseline
covers the skeleton).

## 6. Dockerfile for Railway

Railway facts (docs.railway.com): a `Dockerfile` at the service root is auto-detected; for a
monorepo set the service **root directory to the repo root** and
`RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile`; Railway **injects `PORT`** and the app must bind
`0.0.0.0:$PORT`; set watch paths to `apps/api/**` (+ `packages/**`, root manifests) to skip
rebuilds on mobile/admin commits. Configure the healthcheck path to `/health`.

Base image: build on `oven/bun:1` (pinned minor, e.g. `oven/bun:1.3`), run on **`node:24-alpine`**
(node 24 = active LTS since 2025-10; alpine variant is the smallest official node image and this
stack is pure-JS — no native addons to fight musl). Runtime contents: `dist/` + prod
`node_modules` only; final image lands in the ~150-200 MB range uncompressed, dominated by the
node base. Non-root: the `node` user ships with the official image.

```dockerfile
# apps/api/Dockerfile — build context = repo root (RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile)

# ---- deps + build (bun does everything except run prod) ----
FROM oven/bun:1.3 AS build
WORKDIR /repo
# manifests only -> cached install layer (all workspace package.json files are tiny)
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/
COPY apps/mobile/package.json apps/mobile/
# COPY packages/contracts/package.json packages/contracts/   # when it exists
RUN bun install --frozen-lockfile --filter @mentis/api
COPY apps/api apps/api
# COPY packages/contracts packages/contracts                 # when it exists
WORKDIR /repo/apps/api
RUN bun --bun run build              # tsc -p tsconfig.build.json (--bun: no node in this image)

# ---- prod node_modules only ----
FROM oven/bun:1.3 AS prod-deps
WORKDIR /repo
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/
COPY apps/mobile/package.json apps/mobile/
RUN bun install --frozen-lockfile --production --filter @mentis/api

# ---- runtime: node LTS, non-root, dist + prod deps only ----
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps --chown=node:node /repo/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build     --chown=node:node /repo/apps/api/dist ./apps/api/dist
COPY --from=build     --chown=node:node /repo/apps/api/package.json ./apps/api/
USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
```

Notes:

- All workspace `package.json` manifests are copied so `bun.lock` validates under
  `--frozen-lockfile`; `--filter @mentis/api` (documented `bun install` flag) keeps admin/mobile
  dependency trees out of the image. If `--filter` + `--frozen-lockfile` ever disagree, the
  fallback is a plain root `--production` install (correct, just fatter).
- Copy both the root and workspace `node_modules` dirs — bun's isolated linker (default for new
  monorepos) builds a symlink layout under `node_modules/.bun`; copying the directories wholesale
  preserves it, and node resolves through symlinks (same model as pnpm).
- `bun --bun run build` forces `tsc` (a node-shebang CLI) to execute under bun since the bun image
  has no node.
- `.dockerignore` at repo root: `node_modules`, `**/dist`, `.git`, `.env*`, `apps/admin`,
  `apps/mobile` are the important entries (admin/mobile *source* is excluded; their manifests are
  still sent because explicit `COPY` of a file bypasses nothing — list them as exceptions with
  `!apps/*/package.json`).
- Single-file `bun build --target=node` images (~5 MB app layer) are possible later but require
  the Nest optional-deps `--external` dance (#4803) — not worth it for the skeleton.
- `main.ts` must end with `await app.listen(env.PORT, "0.0.0.0")` — Railway: "bind to `0.0.0.0`
  and listen on the port specified by the `PORT` environment variable".

## 7. Slotting into root `bun run check`

Root scripts run `bun run --filter '*' typecheck` and `--filter '*' test` — a new workspace joins
automatically the moment it has those scripts. No root package.json change needed.

```jsonc
// apps/api/package.json (scripts only)
{
  "name": "@mentis/api",
  "private": true,
  "scripts": {
    "dev": "bun --watch src/main.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/main.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

- **Biome**: nothing to add — root `biome.json` includes `**`; `apps/api/dist` is gitignored and
  the VCS-aware config skips it. No per-app lint scripts (repo rule).
- **Knip**: add a workspace entry to root `knip.json`:

  ```jsonc
  "apps/api": {
    "entry": ["src/main.ts"],
    "project": ["src/**/*.ts", "test/**/*.ts"]
  }
  ```

  Knip's vitest plugin picks up `vitest.config.ts` on its own. Expect to add
  `"ignoreDependencies": ["@swc/core"]` (used implicitly by `unplugin-swc`, same pattern as
  mobile's `expo-updates` ignore) — only if a `knip` run actually flags it.
- **.gitignore**: add `apps/api/dist`.
- `bun run jscpd` and `bun run format` need nothing.

## 8. Scaffold plan (walking skeleton, for #8)

1. `apps/api/` skeleton — `package.json` (§7), `tsconfig.json` + `tsconfig.build.json` (§2),
   `vitest.config.ts` (§4), `.gitignore` entry for `dist`.
2. `src/main.ts` — `reflect-metadata` import, `loadEnv()`, `NestFactory.create<NestExpressApplication>`,
   `app.set("trust proxy", 1)`, `helmet()`, `enableCors` allowlist, `enableShutdownHooks()`,
   `listen(env.PORT, "0.0.0.0")`.
3. `src/app.module.ts` — `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])`, global
   `ThrottlerGuard`, `ENV` provider.
4. `src/health/health.controller.ts` — `@Public() @Get("health")` returning `{ status: "ok" }`.
5. `src/common/` — `zod-validation.pipe.ts` (§3), `admin-key.guard.ts` (timingSafeEqual),
   `supabase-auth.guard.ts` (`getClaims`), `public.decorator.ts`.
6. Tests — pipe unit spec + `/health` e2e spec (fetch-based, §4).
7. Root wiring — `knip.json` workspace entry; verify `bun run check` green from a clean clone.
8. `apps/api/Dockerfile` (§6) + root `.dockerignore`; local proof:
   `docker build -f apps/api/Dockerfile . && docker run -e PORT=3000 -p 3000:3000 ...` then hit
   `/health`.
9. Railway service — root directory = repo root, `RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile`,
   watch paths `apps/api/**`, healthcheck `/health`, env vars from §3.
10. `apps/api/CLAUDE.md` + `CONTEXT.md` stubs; register in root `CONTEXT-MAP.md` (repo
    convention). Supabase project: switch to asymmetric signing keys before the mobile guard ships.

## Sources

- npm registry dist-tags/manifests for `@nestjs/*`, `nestjs-zod`, `helmet`, `@nestjs/throttler`,
  `unplugin-swc`, `@swc/core`, `jose`, `rxjs`, `reflect-metadata` (2026-08-02)
- NestJS docs (raw): `content/recipes/swc.md` (vitest + unplugin-swc), `content/migration.md`
  (Express 5 default, query parser, wildcards)
- Bun docs: `guides/ecosystem/docker` (official multi-stage Dockerfile, `USER bun`),
  `docs/cli/install` (`--filter`, `--production`, `--frozen-lockfile`, isolated linker default),
  bun blog v1.0.3 (`emitDecoratorMetadata` support)
- Bun issues: [#6326](https://github.com/oven-sh/bun/issues/6326) (tsconfig `extends` decorator
  metadata — **still open**), [#4803](https://github.com/oven-sh/bun/issues/4803) (bundling Nest)
- Railway docs: `guides/fixing-common-errors` (`PORT` injection, bind `0.0.0.0`),
  `guides/dockerfiles` (detection, `RAILWAY_DOCKERFILE_PATH`, cache mounts)
- Supabase docs: `guides/auth/signing-keys` (JWKS endpoint, `getClaims` recommendation)
