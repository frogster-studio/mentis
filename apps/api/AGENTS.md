# Mentis — API gateway (NestJS 11, REST-only)

`@mentis/api` workspace of the Mentis monorepo (bun only — see the root `AGENTS.md`). It is the **sole** database gateway: admin and mobile both reach every row through it, and neither holds a database key. Issues live in `.grilled/issues/` (gitignored), implemented via the `implement-next-issue` loop.

Deliberately **not** a bounded context, so no `CONTEXT.md`: a gateway publishes an existing vocabulary rather than owning one. `/app/*` speaks Quiz play (`apps/mobile/CONTEXT.md`), `/admin/*` speaks Catalog curation (`apps/admin/CONTEXT.md`).

## Commands (run in `apps/api`)

- `bun run dev` — watch mode (bun auto-loads `.env`; `cp .env.example .env` then fill the secrets)
- `bun run typecheck` — `tsc --noEmit`
- `bun run test` — vitest, via SWC (esbuild cannot emit decorator metadata)
- `bun run migration:generate` / `migration:run` / `migration:revert` — TypeORM CLI against `DATABASE_URL`; generate diffs the entities against the live schema, so it needs a reachable database — **Hugo runs these, never an agent**
- `bun run build` — `tsc` emit to `dist/`; node runs that output in prod, bun never transpiles prod code
- From the repo root: `bun run check` (typecheck + test + knip + format, all workspaces); **every issue must end with `check` green**

## Hard constraints

- Decorator flags live directly in `tsconfig.json` — never move them into a shared base (bun bug oven-sh/bun#6326). `tsconfig.build.json` needs an explicit `rootDir` beside `outDir` (TS 6).
- **Every row travels through TypeORM** ([ADR 0005](../../docs/adr/0005-the-api-reaches-its-data-through-typeorm.md)): one long-lived `DataSource` on the session pooler, `synchronize: false`, migrations generated from the entities. The service client in `_config/supabase.config.ts` never touches data — it serves `auth.admin.deleteUser` and the Theme image upload signing ([ADR 0007](../../docs/adr/0007-storage-bytes-never-transit-the-api.md)), nothing else. There is still no per-request user-authed client, so owner scoping is explicit owner filters in the repository.
- **`ConfigModule` is imported, never `@Global()`** — every module that needs `ENV`, `SUPABASE` or `JWKS` lists it, `TypeOrmModule.forRootAsync({ imports: [ConfigModule] })` included: a dynamic module resolves in its own scope, not the root's.
- **The schema lives in `src/_database/migrations/`, generated from the entities** — there is no Supabase CLI and no `supabase/` directory. `migration:generate` emits only what entity metadata carries, and it *drops* any index, unique or foreign key it finds in the database but not on an entity — so every one of those belongs on the entity (`@Index`, `@Unique`, a relation with `onDelete`), including the cascade to `auth.users`, which `auth-user.entity.ts` mirrors read-only for exactly that reason.
- **Migrations are generated output, and Hugo runs the generator.** An agent edits the entities and stops there — `bun run migration:generate` is Hugo's command, never an agent's, and a migration is never authored, renamed or edited by hand. What generation cannot emit (RLS, grants, triggers, bucket rows) stays out of the repo: hand it over as SQL snippets for the Supabase dashboard editor, one plain-English comment per statement. The schema is still born locked per [ADR 0003](../../docs/adr/0003-database-admits-only-the-api.md) — RLS everywhere, zero policies, `service_role` alone — but that lock now lives outside the repo, so a new table or function is unreachable until its grant is run by hand.
- Supabase Auth signs access tokens with ES256 asymmetric keys, so JWT verification is local — `jose` against the project JWKS with `iss`/`aud`/`alg` pinned, never a per-request Auth-server call and never the legacy JWT secret. The namespace prefix is the auth boundary: `SupabaseUserGuard` on `/app/me/*`, no auth guard on public `/app` reads, `EditorGuard` on every `/admin/*` route.
- Every non-2xx body is the `ErrorResponse` envelope from `@mentis/contracts/shared`, emitted by `HttpErrorFilter` and nowhere else.
- Wire casing is camelCase, carried by `@Column({ name })` on the entities and the zod contracts — never a hand-aliased select string.
- Throttling is per-surface guards ordered **after** auth, never a global `APP_GUARD`: only a guard that runs after verification can key a bucket on the JWT `sub`. One bucket per tier per caller — public reads and the draw key on `req.ip` (hence `trust proxy 2` — Railway fronts the container with two hops, and trusting one reads the edge's own address), `/app/me/*` and `/admin/*` key one `sub`-keyed bucket.
- `GET /health` stays unguarded and unthrottled: Railway restarts the container on a failed poll.
- The API speaks **JSON only**: `NEST_OPTIONS` turns off Nest's parsers wholesale and `bootstrap.ts` registers json alone, capped at 64 kb against the `.max(200)` push batch caps. Never create the app without `NEST_OPTIONS` — that silently restores Express's unchosen 100 kb wall. A non-JSON body reaches the pipe as `undefined` and 400s; nothing sends one.
- Biome and Knip stay root-only. `biome.json` carries one `apps/api/**` override (`unsafeParameterDecoratorsEnabled`, `useImportType: off` — the safe-fix otherwise rewrites injected services to `import type` and erases Nest's DI metadata).

## Structure

```
src/
  catalog/        # /app/themes + /app/questions: public Quiz play reads
    modules/ controllers/ services/ repositories/ mappers/ _tests/   # the layers of every feature
  competition/    # /app/me/competition: Attempt issuance, resume and the judged finalize
  curation/       # /admin/*: the Editor's Catalog reads, staged content included
  player/         # /app/me: stats, idempotent pushes, account deletion
  _database/      # TypeORM: the module, the datasource options, entities/ — the schema source — and migrations/
  _tests/         # the shared harness plus the specs no feature owns (the bootstrap spine)
  auth/           # SupabaseUserGuard (401) and EditorGuard (403), plus the project JWKS
  common/         # ZodValidationPipe, HttpErrorFilter, the rate-limit tiers
  health/         # GET /health
  _config/        # ConfigModule and its providers: ENV (zod-validated, parsed once at boot), SUPABASE (auth admin and storage signing, never data), JWKS
  bootstrap.ts    # helmet, CORS allowlist, trust proxy, json body cap — shared with the e2e suite
  main.ts         # boot: create, configure, shutdown hooks, listen
  app.module.ts   # root module: feature imports, APP_FILTER
```

Only those four are features. Everything below them is transversal spine — no layer subfolders there, just a `_tests/` where it has tests.

## Conventions

- Files kebab-case, Nest suffixes kept (`*.controller.ts`, `*.module.ts`, `*.guard.ts`, `*.pipe.ts`, `*.filter.ts`).
- **Features are folders of layers.** Each `src/<feature>/` splits by layer — `modules/`, `controllers/`, `services/`, `repositories/`, `mappers/` — and a new file joins its layer folder, never the feature root.

  ```
  ✅ src/catalog/controllers/themes.controller.ts
  ❌ src/catalog/themes.controller.ts
  ```

- **Mappers earn their place by transforming.** A service parses a response its repository already shapes, at the point it lands; `mappers/` appears only where a payload is assembled or fields are held back.

  ```ts
  // ✅ const categories = await this.curationRepository.listCategories();
  //    return adminCategoryListResponseSchema.parse(categories);
  // ❌ mappers/curation.mapper.ts — toAdminCategoryListResponse, a lone schema.parse
  ```

- **Three types cross the layers: input, entity, response.** The controller sees only the contract's input and response; the repository sees only entities — whole, `DeepPartial` for a write, or an id. The service is the sole translator and invents no shape in between: no `Pick`, no `NewX`, no row type restating an entity's columns.

  ```ts
  // ✅ createQuestion(question: DeepPartial<QuestionEntity>): Promise<QuestionEntity>
  // ❌ export type NewQuestion = Pick<QuestionEntity, "themeId" | "text" | "answer">
  ```

- **An aggregate composes its entity.** A read carrying computed columns returns `{ entity, ...computed }`, flattened into the response by the service — never a flat type restating the entity's fields.

  ```ts
  // ✅ interface CuratedTheme { entity: ThemeEntity; questionCount: number }
  // ❌ interface CuratedTheme { id: string; name: string; questionCount: number }
  ```

- **A domain value earns its own type.** The input or output of a calculation that is neither a row nor a payload — `DayScore`, `JudgeableQuestion` — stays free of TypeORM, so the pure function keeps being shared with the phone.

- **Repositories select whole entities.** Holding a column back is the response schema's job: zod strips whatever the contract does not name.

- **A refused write throws a NestJS exception, guarded by a TypeORM read.** Ask before saving; never decode a driver error code, never subclass `Error`.

  ```ts
  // ✅ if (await this.themes.existsBy({ slug })) throw new ConflictException({ message: … });
  // ❌ if (error.driverError?.code === "23505") throw new ThemeNameTakenError();
  ```

- **`src/_database/` owns TypeORM wholesale.** Every entity lives in `_database/entities/` as the schema's source of truth, beside the datasource config, the migrations and shared database logic — a feature folder never defines one.

  ```
  ✅ src/_database/entities/theme.entity.ts
  ❌ src/catalog/theme.entity.ts
  ```

- **Entities all share one shape.** A new entity copies an existing one — `theme.entity.ts` is the reference.

  ```ts
  // ✅ extends BaseEntity, generated uuid key, @Column options, Relation<T>, no `!`
  // ❌ @PrimaryColumn("text"), @Check on the class, a bare relation type, id!: string
  ```

- **Every test lives in a `_tests/` folder**, beside the code it proves — `src/<feature>/_tests/` per feature, `src/auth/_tests/` and `src/common/_tests/` for the spine, `src/_tests/` for the shared harness and what no feature owns. There is no top-level `test/` — vitest looks inside `src/` only, and `tsconfig.build.json` keeps every `_tests/` out of the emit.

  ```
  ✅ src/competition/_tests/seeded-rng.spec.ts · src/auth/_tests/auth.e2e-spec.ts
  ❌ src/competition/seeded-rng.spec.ts · test/auth.e2e-spec.ts
  ```
- Request/response schemas live in `@mentis/contracts`, never here; the API validates requests *and* parses its own responses through them.
- The workspace packages (`@mentis/contracts`, `@mentis/answer-matching` — the judge shared with the phone) are **source-first**: the `bun` export condition (plus tsc `customConditions` and the vitest alias) serves `src/`. `dist/` is built only inside the Docker image, so `bun run check` never builds anything and stays order-independent.
- e2e tests build their app through `bootstrap.ts` when the express-level config is part of what they prove (body cap, `X-Forwarded-For` buckets), so the suite can never drift from `main.ts`.
- Comments follow the repo rule ([docs/agents/conventions.md](../../docs/agents/conventions.md)): none by default — prefer a longer, precise name; business-logic "why" only; one short sentence max, never multi-line, file headers included.

## Environment

`_config/env.config.ts` is the whole config surface: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `DATABASE_URL` (the session-pooler Postgres URL TypeORM connects through — the second secret), `REVENUECAT_WEBHOOK_AUTH` and `REVENUECAT_REST_KEY` (the third and fourth secrets) with `REVENUECAT_PROJECT_ID` beside them, `CORS_ORIGINS` (comma-separated, default `""`, parsed to a list), `PORT` (default 3001 — dodges `next dev` on 3000). `NODE_ENV` is deliberately absent; the Dockerfile sets it for dependency perf paths and nothing in our code reads it. `.env.example` carries real public values, so `cp .env.example .env` plus the four secrets is a full local setup. Any commit that changes env consumption updates `.env.example` in the same commit.
