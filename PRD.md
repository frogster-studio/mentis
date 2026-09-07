# PRD — Leaderboard and Pseudo

Vocabulary: `apps/mobile/CONTEXT.md` (Pseudo, Season, Leaderboard, Standing). Rules: `AGENTS.md`, `apps/api/AGENTS.md`, `apps/mobile/AGENTS.md`, `docs/agents/conventions.md`, `docs/adr/0003-database-admits-only-the-api.md`, `docs/adr/0004-competition-answers-are-judged-server-side.md`, `docs/adr/0005-the-api-reaches-its-data-through-typeorm.md`.

## Decisions

Pseudo
- One per Account, in `player_profiles`: `owner` unique FK to `auth.users` with cascade (the `premium_entitlements` shape), `pseudo` varchar 20 stored as typed, `pseudo_key` varchar 20 unique holding its lowercase form, `created_at`, `updated_at`.
- A valid pseudo is 3 to 20 characters from `[A-Za-z0-9_]`. All digits is valid; there is no first-character rule. Uniqueness is case-insensitive through `pseudo_key`.
- The API derives the default pseudo from the JWT claim `user_metadata.full_name`: the first whitespace-separated word, diacritics stripped, every character outside `[A-Za-z0-9_]` dropped, truncated to 15 characters, `Joueur` when nothing remains or the claim is absent; then five random digits, zero-padded. « Éléonore » → `Eleonore48213`, « Jean-Pierre » → `JeanPierre07731`, no name → `Joueur55020`.
- A default that collides on `pseudo_key` draws new digits until the insert lands. Randomness is injectable.
- The default is created lazily by the API the first time a pseudo is needed: on `GET /app/me/profile` and on `POST /app/me/competition/attempts`, before any draw. There is no gate, no `PSEUDO_REQUIRED`, no ask at sign-in, and Premium never needs one.
- Changeable at any time, no cooldown. Re-setting your own current pseudo, in any casing, answers 200 and stores it as typed.
- The Leaderboard always shows the current pseudo: `player_profiles` is joined at read, never denormalized.
- `GET /app/me/profile` answers `{ pseudo }`, never null. `PUT /app/me/pseudo` with body `{ pseudo }` answers 200 `{ pseudo }`; 400 from the zod pipe; 409 `{ code: "PSEUDO_TAKEN" }` when another owner holds the key. Both live in the player feature behind the Supabase user guard and the authenticated throttle.
- Account deletion cascades `player_profiles` and `competition_standings` through the owner FK; nothing else changes.

Season and Leaderboard
- A Season is the Europe/Paris calendar month of a Competition Day (`seasonBounds`). Only the current Season is served.
- Season Total: the sum over the Season's Competition Days of the day's best finalized score (`bestScorePerDay`). An expired, zero-finalized Attempt counts as 0 and still ranks the Account.
- An Account is ranked from its first finalized Attempt of the Season. Rank = 1 + the number of ranked Accounts with a strictly greater total. Equal totals share a rank; there is no tie-break.
- Pages and positions order by `total DESC, pseudo_key ASC`.
- The Leaderboard is public: a signed-out Player reads it. It shows pseudos and totals alone.

Standings storage
- `competition_standings`: `owner` FK to `auth.users` with cascade, `season` varchar 7 (`YYYY-MM`), `total` integer, `created_at`, `updated_at`; unique `(owner, season)`; index `(season, total)` scanned backward for `total DESC` within a fixed Season (TypeORM 1.1's PostgreSQL generator does not emit per-column index directions).
- The row is written inside the finalize transaction, the lazy zero-finalize of a dead day included: the owner's total for that Attempt's Season is recomputed from every finalized Attempt of the Season and upserted. Never incremented, so the write is idempotent and self-healing.
- No backfill: there are no users.
- Ranks, pages and counts are derived at read from this table, never stored.

API
- `GET /app/competition/leaderboard?page=N` in a separate `leaderboard.controller.ts` of the competition feature: no auth guard, public throttle keyed on the IP. `page` optional, default 1; non-integer or below 1 answers 400. Answers `{ season, page, pageCount, entries: [{ rank, pseudo, seasonTotal }] }`. Page size 50, a contract constant. `pageCount` = ceil(rankedCount / 50), 0 when nobody is ranked. A page beyond `pageCount` answers an empty `entries` with the current `pageCount`.
- Page ranks come from `RANK()` over the first `50 × N` rows of the index order, then the page offset: cost O(50 N), never O(n). `pageCount` costs one index-only `count(*)` per call. Both accepted as the MVP bound.
- `GET /app/me/competition/standing` answers `{ season, seasonTotal, rank, rankedCount, page }` from the caller's standings row, in one query: `rank` = 1 + count(total > mine); position = rank + count(total = mine and pseudo_key < mine); `page` = ceil(position / 50); `rankedCount` = count of the Season's rows. Without a row: `seasonTotal` 0, `rank` null, `page` null, `rankedCount` still counted. The `days` field is removed from the contract and the mapper.
- The standing read keeps burying dead days first (`attemptsStillInPlay`), so a silent Attempt lands in the standings before the read answers.
- Attempt issuance ensures the profile through a service the player module exports, the way the competition module already imports `PremiumService`.
- Season for both reads is the current Competition Day's, from the injected clock.

Contracts
- `packages/contracts/src/app`: the pseudo schema (regex, 3–20), the profile response, the pseudo input, the leaderboard page response, the standing response reshaped, `LEADERBOARD_PAGE_SIZE = 50`. `PSEUDO_TAKEN` joins `shared/error.ts`.

Mobile
- Follow the current visual direction. No new styling constant anywhere: no theme token or color role, no `TEXT` style, no module-level size, width or alpha constant. Every style composes the existing `COLORS`, `TEXT`, `SPACE`, `GUTTER`, `RADIUS`, `PRESSED`.
- Placement: profile read, pseudo write and the pseudo Sheet in `features/account`; the standing read in `features/competition`; the leaderboard page read, list and pager in `features/world`. French copy in each feature's `constants.ts`.
- `AppHeader`, Compétition tab: the greeting slot shows the pseudo alone, no « Salut », the whole slot tappable to open the Sheet; empty when signed out. The Accueil tab keeps « Salut Prénom ! ». The title slot shows « 12e sur 340 · 412 pts » when signed in and ranked, « Compétition » otherwise (signed out, unranked, loading, error). Both swaps ride the existing title cross-fade. French ordinals: 1er, 2e, 3e.
- The pseudo Sheet: the house `Sheet`, title « Ton pseudo », one `TextInput` prefilled with the current pseudo, client validation mirroring the contract with « 3 à 20 caractères : lettres, chiffres ou _ », one `NewButton` « Valider » with the pending flag, 409 rendered « Ce pseudo est déjà pris », any other failure a French error, dismissible except while pending; success invalidates the profile query and closes the Sheet.
- Compétition tab: the competition cards stay above; below them the leaderboard list. The tab becomes a scroll feeding the header collapse through `useTabScroll`. Opens on the Standing's page when signed in and ranked, else page 1. A row is rank, pseudo, « 412 pts »; the caller's own row is highlighted with an existing color role. `ScreenLoading` while a page loads, `ScreenError` with retry on failure, « Personne n'est encore classé ce mois-ci. » when `pageCount` is 0. Signed out: the list alone, page 1.
- Pager: a row sticky under the cards, « Début · ‹ · 12 / 340 · › · Fin », plus « Ma page » only when ranked and off that page. Bare `Pressable` taps dimmed with `PRESSED`, disabled at the bounds. A page beyond `pageCount` clamps to the last page.
- Freshness: no server cache. `pushFinalize` invalidates the standing and leaderboard queries beside the day. Both are re-read when the tab gains focus.
- « Compte », signed in: the pseudo under the email, tap opens the Sheet. Anonymous Players see no change.

Docs
- New `docs/adr/0009-season-standings-are-materialized-per-account-at-finalize.md`: the table, the recompute-on-finalize rule, ranks derived at read; rejected a Redis sorted set (a new infrastructure piece, a new secret, a rebuild path, and ADR 0005's TypeORM-only rule), a materialized view (staleness, a cron, bloat) and read-time aggregation (O(n) per call). One sentence stating the choice was made for an MVP under 100 000 users, and that scaling past it means a ranking index such as Redis sorted sets fed from this table.
- `docs/adr/0004`: « season totals are derived at read » becomes the new truth with a pointer to ADR 0009, forward-only, no banner.
- `apps/api/AGENTS.md`: `premium/` joins the structure block and the feature count reads five.

Tests
- API: e2e through the Nest testing module with fake repositories, prior art `apps/api/src/player/_tests/app-me.e2e-spec.ts` and `apps/api/src/competition/_tests/app-competition.e2e-spec.ts`. Pure functions with a spec beside `day-offers.spec.ts` and `seeded-rng.spec.ts`: default pseudo derivation with injected digits, pseudo key, season total of an owner, rank, position, page and page count over a list.
- Contracts: a spec beside each sibling.
- Mobile: vitest on pure logic only, prior art `features/competition/requests.test.ts`: pseudo validation, request builders and parsers, the French ordinal and the standing title. No component rendering tests.
- The existing competition e2e stays green and proves in addition that a finalize writes the standings row.

Out of scope
- Percentile or « top X % », past Seasons, all-time totals, moderation and reserved words, pseudos in the admin, end-of-season notifications, leagues, friends, battles, backfill of existing Attempts, any server cache, Redis.

## Items

```json
[
  {
    "category": "schema",
    "description": "player_profiles and competition_standings entities",
    "steps": [
      "player-profile.entity.ts and competition-standing.entity.ts beside their siblings under apps/api/src/_database/entities, the shape of premium-entitlement.entity.ts: BaseEntity, generated uuid, owner FK to auth.users with onDelete CASCADE, timestamps",
      "player_profiles: pseudo varchar 20, pseudo_key varchar 20, @Unique on owner and on pseudo_key, named in the siblings' style",
      "competition_standings: season varchar 7, total integer, @Unique on (owner, season), @Index on (season, total) supporting total DESC by backward scan within a fixed Season",
      "bun run typecheck passes",
      "Do NOT run migration:generate; write in progress.txt that the human must generate the migration"
    ],
    "passes": true
  },
  {
    "category": "contracts",
    "description": "App contracts: pseudo, profile, leaderboard page, standing reshaped, PSEUDO_TAKEN, LEADERBOARD_PAGE_SIZE",
    "steps": [
      "Schemas in packages/contracts/src/app exported like their siblings; PSEUDO_TAKEN added to shared/error.ts; LEADERBOARD_PAGE_SIZE = 50 exported",
      "The pseudo schema rejects 2 and 21 characters, a space, an accented letter and a hyphen; accepts 3 and 20 characters, all digits and an underscore",
      "The profile response requires a string pseudo; the pseudo input requires { pseudo }",
      "The leaderboard page response accepts pageCount 0 with empty entries and rejects a negative rank or seasonTotal",
      "The standing response requires season, seasonTotal, rank nullable, rankedCount, page nullable, and rejects a days field",
      "bun run test passes in @mentis/contracts"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "Pure pseudo utilities: default derivation and pseudo key",
    "steps": [
      "Utilities under apps/api/src/player/utils with their spec in apps/api/src/player/_tests, digits injected as a function",
      "defaultPseudo of « Éléonore Dupont » with digits 48213 is Eleonore48213; « Jean-Pierre » is JeanPierre07731; « Maximilien-Alexandre » is truncated to 15 letters plus the digits; undefined and «   » give Joueur55020",
      "pseudoKey lowercases and nothing else; the derived default always satisfies the contract's pseudo schema",
      "bun run test passes in @mentis/api"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "GET /app/me/profile and PUT /app/me/pseudo in the player feature",
    "steps": [
      "Repository reads by owner, reads by pseudo_key, inserts if absent (ON CONFLICT DO NOTHING on owner), updates by owner",
      "A ProfileService exported by PlayerModule exposes ensureProfile(owner, claims) and setPseudo(owner, pseudo)",
      "Unauthenticated: 401 on both",
      "GET with no row creates the default from the token's full_name and answers it; a second GET answers the same pseudo",
      "GET with no row when the default's key is taken draws new digits and answers a free pseudo",
      "PUT of a pseudo whose key another owner holds, any casing, answers 409 PSEUDO_TAKEN",
      "PUT of your own current pseudo in another casing answers 200 and GET answers the new casing",
      "Invalid body answers 400",
      "e2e through the Nest testing module with a fake repository, the shape of app-me.e2e-spec.ts"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "Attempt issuance ensures the profile",
    "steps": [
      "CompetitionModule imports PlayerModule's ProfileService the way it imports PremiumService",
      "POST /app/me/competition/attempts for an owner without a profile row creates the default before any draw, and the issued Attempt is served as before",
      "With a profile row, issuance behaves exactly as before",
      "The existing competition e2e stays green with a fake profile repository"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "Finalize writes the owner's standings row",
    "steps": [
      "A pure seasonTotal(dayScores) beside bestScorePerDay, spec beside day-offers.spec.ts",
      "CompetitionRepository.finalize recomputes the owner's total for the Attempt's Season from every finalized Attempt of that Season and upserts competition_standings (owner, season) inside the same transaction",
      "e2e: finalizing an Attempt scored 30 writes total 30; a Replay scored 20 the same day leaves 30; a second day scored 10 writes 40; a finalize that lost the claim writes nothing",
      "e2e: a dead day buried by the lazy zero-finalize writes a row with total 0 for that Attempt's Season",
      "An Attempt attributed to the previous Season (a Catch-up across no season edge is impossible, so a plain previous-month row) updates that Season's row, not the current one"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "GET /app/me/competition/standing answers rank, rankedCount and page",
    "steps": [
      "Pure rank/position/page helpers with a spec: totals 10, 10, 5 rank 1, 1, 3; position breaks ties by pseudo_key; page of position 51 is 2; pageCount of 0 is 0, of 50 is 1, of 51 is 2",
      "Repository answers, in one query for a season and an owner: the owner's row or null, count(total > mine), count(total = mine and pseudo_key < mine), count(*)",
      "Response parsed through the reshaped contract: season, seasonTotal, rank, rankedCount, page; days is gone from the mapper",
      "e2e: two Accounts with different totals rank 1 and 2 with rankedCount 2; equal totals share rank 1 and their pages follow pseudo_key order; a caller without a finalized Attempt gets seasonTotal 0, rank null, page null and the true rankedCount; 401 unauthenticated"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "GET /app/competition/leaderboard?page=N, public",
    "steps": [
      "leaderboard.controller.ts in apps/api/src/competition/controllers with no auth guard and the public throttler guard; the module registers it",
      "Query validated by zod: page optional, integer, min 1; 400 otherwise",
      "Repository answers one page: standings joined to player_profiles, RANK() over the first LEADERBOARD_PAGE_SIZE × N rows ordered total DESC, pseudo_key ASC, then the page offset; and the season's count(*)",
      "Response parsed through the contract: season, page, pageCount, entries with rank, pseudo, seasonTotal",
      "e2e without a token: 60 Accounts fill pages 1 and 2 with ranks continuing across the page edge; equal totals share a rank and order by pseudo; page 3 answers empty entries with pageCount 2; page 0 answers 400; an empty season answers pageCount 0 and no entries; a renamed pseudo shows its new value"
    ],
    "passes": true
  },
  {
    "category": "docs",
    "description": "ADR 0009, ADR 0004 corrected, API AGENTS.md counts five features",
    "steps": [
      "docs/adr/0009-season-standings-are-materialized-per-account-at-finalize.md exists, in the shape of 0006: the decision paragraph, the rejected alternatives (Redis sorted set, materialized view, read-time aggregation) and a Consequences list",
      "It carries one sentence saying the choice serves an MVP under 100 000 users and that scaling past it means a ranking index such as Redis sorted sets fed from this table",
      "docs/adr/0004 no longer says season totals are derived at read; the sentence states the materialized Season Total and points to ADR 0009, with no banner and no history",
      "apps/api/AGENTS.md lists premium/ in the structure block and says five features",
      "bun run format leaves the files unchanged"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "Seam: profile read, pseudo write, standing read, leaderboard page read",
    "steps": [
      "Request builders and parsers in features/account/requests.ts (profile, pseudo), features/competition/requests.ts (standing) and features/world/requests.ts (leaderboard page), the shape of the existing competition requests",
      "react-query hooks and keys beside each feature's siblings: useProfile, useSetPseudo, useStanding, useLeaderboardPage(page); the leaderboard read sends no Authorization header",
      "pushFinalize invalidates the standing and leaderboard keys beside the day key",
      "Builders and parsers covered by vitest like requests.test.ts, including a 409 surfacing as an ApiError with code PSEUDO_TAKEN",
      "bun run typecheck and bun run test pass in @mentis/mobile"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The pseudo Sheet",
    "steps": [
      "PseudoSheet in features/account/components on the house Sheet: title « Ton pseudo », one TextInput prefilled with the current pseudo, one NewButton « Valider » with pending, French copy in features/account/constants.ts",
      "A pure isValidPseudo mirrors the contract and is unit tested; an invalid value shows « 3 à 20 caractères : lettres, chiffres ou _ » and disables Valider",
      "409 shows « Ce pseudo est déjà pris »; any other failure shows a French error; the Sheet is not dismissible while pending",
      "Success invalidates the profile query and closes the Sheet",
      "No new styling constant: styles compose existing tokens only"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "AppHeader shows the pseudo and the Standing on the Compétition tab",
    "steps": [
      "On /world the greeting slot renders the pseudo alone, the whole slot a bare Pressable dimmed with PRESSED that opens PseudoSheet; empty when signed out; / keeps « Salut Prénom ! »",
      "On /world the title reads « 12e sur 340 · 412 pts » when signed in and ranked, « Compétition » when signed out, unranked, loading or failed; the swap rides the existing title cross-fade",
      "Pure formatRank (1er, 2e, 3e, 21e) and standingTitle helpers unit tested",
      "No new styling constant"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The leaderboard list on the Compétition tab",
    "steps": [
      "WorldScreen keeps the competition cards above and renders the leaderboard below; the tab scrolls and feeds the header collapse through useTabScroll",
      "Opens on the Standing's page when signed in and ranked, else page 1; a row shows rank, pseudo and « 412 pts »; the caller's own row is highlighted with an existing color role",
      "ScreenLoading while a page loads, ScreenError with retry on failure, « Personne n'est encore classé ce mois-ci. » when pageCount is 0",
      "Signed out: the list alone on page 1",
      "The page is re-read when the tab gains focus",
      "No new styling constant"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The sticky pager",
    "steps": [
      "A pager row sticky under the cards: « Début », « ‹ », « 12 / 340 », « › », « Fin »; bare Pressable taps dimmed with PRESSED, disabled at the bounds",
      "« Ma page » appears only when the caller is ranked and the shown page is not the Standing's page",
      "A pure clampPage helper unit tested: a page beyond pageCount becomes the last page, pageCount 0 shows page 1 with every control disabled",
      "No new styling constant"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "« Compte » shows the pseudo",
    "steps": [
      "Signed in: the pseudo under the email, a bare Pressable dimmed with PRESSED that opens PseudoSheet",
      "Anonymous Players see no change",
      "No new styling constant"
    ],
    "passes": false
  }
]
```

## Human steps

- After item 1 is committed: `cd apps/api && bun run migration:generate`, commit the migration, then run the ADR 0003 lock SQL on the dashboard for `player_profiles` and `competition_standings` (RLS on, zero policies, `service_role` grants).
- Before merging: `NODE_ENV=production bun run migration:run` from `apps/api`.
