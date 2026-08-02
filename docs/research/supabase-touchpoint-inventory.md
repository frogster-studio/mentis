# Supabase touchpoint inventory (wayfinder research #3)

Raw material for the future `apps/api` endpoint list. Every place either app (or a script) talks to
Supabase, as of this branch point. Method: read of every file importing `@supabase/supabase-js` in
`apps/admin/src`, `apps/mobile/src`, `apps/mobile/scripts`, plus all `supabase/migrations/*.sql`;
the main worktree's uncommitted changes were diffed too — they are Biome formatting only (quote
style / line wrapping in `confirm-dialog.tsx`, `transfer-prompt.tsx`), zero Supabase relevance.

## Schema baseline (what exists, per `supabase/migrations/`)

| Object | Kind | Access model | Touched by |
| --- | --- | --- | --- |
| `cards` | table | RLS on, **no policies** — service-role only | admin (all CRUD), verify script |
| `themes` | table | RLS: anon SELECT | mobile, seed/verify scripts |
| `questions` | table | RLS: anon SELECT | mobile (via RPC), seed/verify scripts |
| `quiz_sessions` | table | RLS: owner-only INSERT/SELECT (authenticated); no update/delete policies (append-only) | mobile, verify script |
| `stat_baselines` | table | RLS: owner-only INSERT/SELECT (authenticated); append-only | mobile, verify script |
| `card-images` | storage bucket | public read, `image/webp` only; writes via signed upload URLs (ADR 0001) | admin |
| `get_random_questions(theme_slug)` | function (RPC) | security invoker; reachable by anon through SELECT policies | mobile, verify script |
| `delete_account()` | function (RPC) | security **definer**; EXECUTE granted to `authenticated` only; deletes `auth.users` row of the caller, player tables cascade | mobile |
| `set_updated_at()` | trigger function | internal (`cards` trigger; only content changes bump `updated_at`) | — |

**No table or bucket is untouched by app code.** The category-era tables (`categories`,
`question_categories`) were dropped by `20260722000000_theme_content_schema.sql` and no longer
exist. No realtime, no edge functions anywhere (the `delete_account` migration mentions an edge
function only as a sanctioned *fallback*, never built).

## Touchpoints — apps/admin

All server-side through `createServiceClient()` (`apps/admin/src/lib/supabase.ts:5` — service-role
key, bypasses RLS, `persistSession:false`). Gate is the admin's **own cookie session**
(`requireSession()`); admin never uses Supabase Auth.

| # | file:line | Kind | Table/bucket | Filter / payload shape | Feature |
| --- | --- | --- | --- | --- | --- |
| A1 | `apps/admin/src/lib/cards/data.ts:46` | mutation (insert) | `cards` | `{type,title,tags,payload,images}` → `.select().single()` | create Card (New Card sheet) |
| A2 | `apps/admin/src/lib/cards/data.ts:97` | query (list) | `cards` | `select("*", count:"exact")`, optional `ilike(title, %search%)` (LIKE-escaped), `eq(type,…)`, `contains(tags,[tag])`; `order(updated_at desc)`, `range()` pages of 20 | Card library list: search, type/tag filter, pagination |
| A3 | `apps/admin/src/lib/cards/data.ts:128` | query (single) | `cards` | `eq(id).maybeSingle()` | edit-Card page load; also re-read inside update & posted-mark actions |
| A4 | `apps/admin/src/lib/cards/data.ts:141` | mutation (update) | `cards` | full content `{type,title,tags,payload,images}` by `eq(id)` | save Card edits |
| A5 | `apps/admin/src/lib/cards/data.ts:176` | mutation (update) | `cards` | `{posted_on: Social[]}` by `eq(id)` — explicit set, idempotent | toggle Posted-on-Social marks |
| A6 | `apps/admin/src/lib/cards/data.ts:191` | mutation (delete) | `cards` | `delete().eq(id).select("images")` — returns image paths for cleanup | delete Card (+ storage cleanup A8) |
| A7 | `apps/admin/src/lib/images/storage.ts:7` | storage (no network) | `card-images` | `getPublicUrl(path)` — URL derived locally | render stored Images in edit sheet (`app/cards/[id]/page.tsx:48`) |
| A8 | `apps/admin/src/lib/images/storage.ts:14` | storage (delete) | `card-images` | `remove(paths[])` | orphan cleanup on Card update (removed Images) & delete |
| A9 | `apps/admin/src/lib/images/actions.ts:16` | storage (signed URL) | `card-images` | `createSignedUploadUrl("{uuid}.webp")` → `{path,url}` | mint upload URL for the browser (ADR 0001) |
| A10 | `apps/admin/src/lib/images/browser.ts:41` | storage (HTTP PUT) | `card-images` | browser `fetch(url, PUT, image/webp blob)` **directly to the signed URL** — not via SDK | upload processed webp from create/edit sheets |

`lib/cards/data.test.ts` and `lib/images/storage.test.ts` import only the `SupabaseClient` *type*
and run against in-memory fakes — not live touchpoints.

## Touchpoints — apps/mobile (data; publishable key + user JWT under RLS)

Client: `apps/mobile/src/lib/supabase.ts:19` — publishable key, session persisted to AsyncStorage,
auto-refresh driven by AppState.

| # | file:line | Kind | Table/RPC | Filter / payload shape | Feature |
| --- | --- | --- | --- | --- | --- |
| M1 | `apps/mobile/src/features/quiz/api.ts:19` | query | `themes` | `select("id, name, questions(count)")` — aggregate embed | Theme picker / home (theme list with question counts) |
| M2 | `apps/mobile/src/features/quiz/api.ts:46` | **rpc** | `get_random_questions` | `{theme_slug}` → 10 random question rows | start a Quiz Session (one stable draw per mount) |
| M3 | `apps/mobile/src/features/account/api.ts:43` | query | `stat_baselines` | `select(theme_id, theme_name, total_points, session_count).eq(owner)` | Account Stats shelf (baselines half of the world pull) |
| M4 | `apps/mobile/src/features/account/api.ts:48` | query | `quiz_sessions` | `select(id, theme_id, theme_name, points).eq(owner).order(finished_at asc)` | Account Stats shelf (sessions half; oldest-first for the fold) |
| M5 | `apps/mobile/src/features/quiz/outbox-sync.ts:46` | mutation (upsert) | `quiz_sessions` | batch rows `{id(client uuid), owner, theme_id, theme_name, points, finished_at}`, `onConflict:"id"`; treats PG error `23503` as "owner gone" → discard queue | outbox push of finished sessions (launch / foreground / sign-in / finish) |
| M6 | `apps/mobile/src/features/quiz/transfer-sync.ts:38` | mutation (upsert) | `stat_baselines` | batch rows keyed `(owner,device,theme_id)`, `ignoreDuplicates:true` — insert-if-absent | Stats Transfer (move Device Stats onto the Account, idempotent) |
| M7 | `apps/mobile/src/features/account/delete-account.ts:17` | **rpc** | `delete_account` | no args — deletes the *calling* auth user; player tables cascade | account deletion (App Store 5.1.1(v) / GDPR erasure) |

## Stays client-side — mobile Supabase Auth (NOT endpoints)

Auth remains a direct client↔Supabase relationship after the migration; the future API only needs
to **verify** the Supabase JWT. Flagged per the ticket:

| file:line | Call | Purpose |
| --- | --- | --- |
| `apps/mobile/src/lib/supabase.ts:19` | `createClient(auth: AsyncStorage, persistSession, autoRefreshToken)` | session persistence & refresh |
| `apps/mobile/src/lib/supabase.ts:34-36` | `auth.startAutoRefresh()` / `stopAutoRefresh()` | foreground-only token refresh (AppState) |
| `apps/mobile/src/features/account/auth-store.ts:24` | `auth.onAuthStateChange` | app-wide session store (single subscription) |
| `apps/mobile/src/features/account/auth.ts:51` | `auth.signInWithIdToken({provider:"apple"})` | Apple sign-in |
| `apps/mobile/src/features/account/auth.ts:61` | `auth.updateUser({data:{full_name}})` | capture Apple-offered name (best-effort) |
| `apps/mobile/src/features/account/auth.ts:89` | `auth.signInWithIdToken({provider:"google"})` | Google sign-in |
| `apps/mobile/src/features/account/auth.ts:99` | `auth.updateUser({data:{full_name}})` | capture Google profile name (best-effort) |
| `apps/mobile/src/features/account/auth.ts:104` | `auth.signOut()` | sign-out |
| `apps/mobile/src/features/account/delete-account.ts:37` | `auth.signOut({scope:"local"})` | drop orphaned local session after account deletion |

## Touchpoints — apps/mobile/scripts (doomed to deletion; inventoried so nothing hides)

Both scripts build their own clients from `.env` (`seed.ts:16` service client via
`SUPABASE_SECRET_KEY`; `verify-content.ts:27,30` one anon + one admin client).

| file:line | Kind | Table/RPC | Shape | Purpose |
| --- | --- | --- | --- | --- |
| `scripts/seed.ts:24` | mutation (upsert) | `themes`, then `questions` | full rows from `feed.json` via `transformFeed` | idempotent content seed of the hosted project |
| `scripts/verify-content.ts:48,55,76` | query | `themes`, `questions` | anon SELECTs (list, exact count, single) | RLS acceptance checks |
| `scripts/verify-content.ts:63,66,73` | mutation (expected to fail) | `themes`, `questions` | anon INSERT/UPDATE/DELETE probes | prove anon writes are rejected |
| `scripts/verify-content.ts:83` | rpc | `get_random_questions` | `{theme_slug}` | prove the draw contract (10 distinct, right theme, 3 wrong choices) |
| `scripts/verify-content.ts:102` | query | `questions` | admin SELECT all, ordered | seeded rows match transform output |
| `scripts/verify-content.ts:140,147` | query (expected empty/fail) | `quiz_sessions`, `stat_baselines` | anon SELECT probes | prove player tables block anon reads |
| `scripts/verify-content.ts:154,157` | mutation (expected to fail) | `quiz_sessions`, `stat_baselines` | anon INSERT probes | prove player tables block anon writes |
| `scripts/verify-content.ts:161` | query | `cards` | admin `count:"exact", head:true` | prove the cards table survived |

## First-cut endpoint candidates

### Admin surface (7) — replaces the service-role client; caller authenticated by the admin cookie session

| Candidate | Wraps | Notes |
| --- | --- | --- |
| `GET /admin/cards` | A2 | params: `search`, `type`, `tag`, `page` (pageSize 20); returns rows + exact total |
| `POST /admin/cards` | A1 | card content payload |
| `GET /admin/cards/:id` | A3 | 404 on missing/malformed uuid |
| `PUT /admin/cards/:id` | A4 (+A8) | full content update; server also removes de-referenced storage objects |
| `PATCH /admin/cards/:id/posted` | A5 (+A3) | `{social, posted}` — explicit set, idempotent |
| `DELETE /admin/cards/:id` | A6 (+A8) | delete row, then drop its storage objects (row-first ordering preserved) |
| `POST /admin/card-images/upload-url` | A9 | returns `{path, signedUrl}`; browser keeps PUTing bytes straight to storage (A10) — image bytes never transit the API (ADR 0001) |

A7 (`getPublicUrl`) needs **no endpoint** — it is local URL string-building; the client only needs
the public storage base URL. A8 has no standalone endpoint — it folds into PUT/DELETE above.

### Mobile surface (6) — caller authenticated by the Supabase JWT (verified by the API), except the two public content reads

| Candidate | Wraps | Notes |
| --- | --- | --- |
| `GET /themes` | M1 | public; themes with question counts |
| `GET /themes/:id/question-draw` | M2 | public; 10 random questions (wraps the RPC; must stay one-draw-per-session semantics client-side) |
| `GET /me/world` | M3+M4 | owner-scoped; the two parallel selects collapse naturally into one payload `{baselines, sessions}` |
| `POST /me/quiz-sessions` | M5 | batch, idempotent on client UUID; **must return a distinguishable "owner gone" signal** (today: PG `23503`) so the outbox can discard vs retain |
| `POST /me/stat-baselines` | M6 | batch, insert-if-absent on `(owner,device,theme_id)` — retried accepts must stay no-ops |
| `DELETE /me/account` | M7 | wraps the security-definer RPC; identity comes from the verified JWT (RPC is hard-wired to `auth.uid()`) |

Scripts get no endpoints — they die; seeding becomes an API/CI concern when `supabase/` moves into
`apps/api`.

## Surprises & notes

1. **Two RPCs exist despite "none expected":** `get_random_questions` (quiz draw, security
   invoker) and `delete_account` (security definer, authenticated-only). Both are clean endpoint
   material; `delete_account`'s `auth.uid()` hard-wiring means the API must call it with (or on
   behalf of) the user's JWT, not the service key — or re-implement the cascade under service role.
2. **Admin never touches Supabase Auth.** It runs a custom HMAC cookie session
   (`lib/auth/{credentials,session}.ts`) and the service-role key for everything — RLS on `cards`
   is "no policies", i.e. the API inherits full responsibility for admin authorization.
3. **Image bytes already bypass the server** (browser PUT to a signed URL, A10). The endpoint
   migration only moves the URL-minting, keeping ADR 0001 intact.
4. **Owner-gone detection is a Postgres error-code contract** (`23503` in `outbox-sync.ts:31-33`).
   An API must preserve an equivalent typed error or the outbox retention logic breaks silently.
5. **Mobile leans on RLS for all owner scoping** (player tables) and on anon SELECT policies for
   content. Once the API fronts these with a service key, that scoping must be re-implemented
   server-side — nothing in the client sends `owner` filters it couldn't fake today; RLS is the
   real guard.
6. **No realtime, no edge functions, no storage use in mobile; no untouched tables or buckets.**
7. Main-worktree uncommitted changes reviewed: formatting-only (plus an empty untracked
   `apps/admin/src/lib/supabase/` directory — leftover, not code).
