# PRD — Leaderboard and pseudo (Ralph sprint)

Vocabulary: `apps/mobile/CONTEXT.md`. Rules: the `AGENTS.md` of every app touched, `docs/agents/conventions.md`, `docs/adr/0004-competition-answers-are-judged-server-side.md`.

## Decisions

Pseudo
- One per Account, in a `player_profiles` table: `owner` unique FK to `auth.users` with cascade (the `premium_entitlements` pattern), `pseudo` as typed (varchar 20), `pseudo_key` its lowercase form (varchar 20, unique), `created_at`, `updated_at`.
- A valid pseudo has 3 to 20 characters from `[A-Za-z0-9_]`. Uniqueness is case-insensitive through `pseudo_key`.
- Changeable at any time. Re-setting your own pseudo is a plain success.
- `GET /app/me/profile` answers `{ pseudo: string | null }`, null with no row (the premium read's shape: no row is a state, not a 404).
- `PUT /app/me/pseudo` with body `{ pseudo }` answers 200 `{ pseudo }`; 400 from the zod pipe; 409 `{ code: "PSEUDO_TAKEN" }` when another owner holds the key.
- Both sit in the player feature beside `/app/me/stats`, behind the Supabase user guard and the authenticated throttle.

Competition needs a pseudo
- `POST /app/me/competition/attempts` answers 403 `{ code: "PSEUDO_REQUIRED" }` when the caller has no profile row, before any issuance logic. Same error shape as `PREMIUM_REQUIRED`. The day, active and finalize reads stay untouched.

Leaderboard
- Season total per Account: the sum over its Competition Days of the day's best finalized score (the standing read's rule, applied to every Account).
- Rank: 1 + the number of Accounts with a strictly greater total. Ties share a rank.
- Top percent: the smallest bucket of `[0.1, 1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]` such that `rank / rankedCount * 100 <= bucket`.
- `GET /app/me/competition/leaderboard?season=YYYY-MM` (season optional, defaults to the current Competition Day's season) answers `{ season, rankedCount, entries, me }`: `entries` is the top 50 as `{ rank, pseudo, seasonTotal }` ordered by rank then pseudo; `me` is `{ rank, seasonTotal, topPercent }` or null when the caller has no finalized Attempt that season. Accounts without a pseudo are never ranked.
- `GET /app/me/competition/standing` gains `allTime`: the sum of every day's best score across all seasons.

Mobile
- The pseudo lives in the account feature, the leaderboard in the world feature, the gate in the competition feature.
- Pseudo entry is the house Sheet: one TextInput, client validation mirroring the contract, one NewButton with the pending treatment, French copy in the feature constants, a 409 rendered as « Ce pseudo est déjà pris ».
- On the Compétition tab, a signed-in Player without a pseudo gets the Sheet before any Attempt is issued; a `PSEUDO_REQUIRED` from the API opens the same Sheet and retries the issuance on success. Signed-out Players see no change.
- The Compétition tab replaces « Bientôt disponible. » with the leaderboard: my line (rank, top %, season total, all-time) above the top 50, with the house loading, error and empty states.
- « Compte » shows the pseudo under the email; tapping it opens the Sheet to change it.

Tests
- API: e2e through the Nest testing module with fake repositories (prior art `apps/api/src/player/_tests/app-me.e2e-spec.ts` and `apps/api/src/competition/_tests/app-competition.e2e-spec.ts`); ranking as pure units beside `day-offers.spec.ts`.
- Contracts: a spec beside each sibling.
- Mobile: vitest on pure logic only, request builders and parsers as in `features/competition/requests.test.ts`. No component rendering tests.

## Items

```json
[
  {
    "category": "schema",
    "description": "player_profiles entity: owner unique FK auth.users cascade, pseudo, pseudo_key unique lowercase, timestamps",
    "steps": [
      "Entity file beside its siblings under apps/api/src/_database/entities, picked up by the existing glob",
      "Unique constraints and index named in the siblings' style",
      "bun run typecheck passes",
      "Do NOT run migration:generate; write in progress.txt that the human must generate the migration"
    ],
    "passes": false
  },
  {
    "category": "contracts",
    "description": "App contracts: pseudo input, profile response, leaderboard response, standing gains allTime",
    "steps": [
      "Schemas in packages/contracts/src/app, exported like their siblings",
      "Pseudo rejects 2 and 21 characters and any character outside [A-Za-z0-9_]",
      "Profile accepts a null pseudo; leaderboard accepts a null me and an empty entries array",
      "Standing rejects a negative allTime",
      "bun run test passes in @mentis/contracts"
    ],
    "passes": false
  },
  {
    "category": "api",
    "description": "GET /app/me/profile and PUT /app/me/pseudo in the player feature",
    "steps": [
      "Repository reads by owner, reads by pseudo_key, upserts by owner",
      "Unauthenticated: 401 on both",
      "GET with no row answers { pseudo: null }; after a PUT it answers the stored pseudo as typed",
      "PUT of a pseudo whose key another owner holds, any casing, answers 409 PSEUDO_TAKEN",
      "PUT of your own current pseudo answers 200",
      "Invalid body answers 400",
      "e2e through the Nest testing module with a fake repository"
    ],
    "passes": false
  },
  {
    "category": "api",
    "description": "Attempt issuance refuses an Account without a pseudo",
    "steps": [
      "POST /app/me/competition/attempts answers 403 PSEUDO_REQUIRED before any draw when no profile row exists",
      "With a profile row, issuance behaves exactly as before",
      "The existing competition e2e spec stays green with a profile seeded"
    ],
    "passes": false
  },
  {
    "category": "api",
    "description": "Pure ranking utilities: rank totals with shared ranks, top percent bucket",
    "steps": [
      "Utilities under apps/api/src/competition/utils with their spec beside day-offers.spec.ts",
      "Totals 10, 10, 5 rank 1, 1, 3",
      "Rank 1 of 1000 is top 0.1; rank 1 of 10 is top 10; rank 7 of 10 is top 70; last is top 100",
      "bun run test passes in @mentis/api"
    ],
    "passes": false
  },
  {
    "category": "api",
    "description": "GET /app/me/competition/leaderboard",
    "steps": [
      "Repository aggregates per-owner season totals from finalized attempts within the season bounds, joined to profiles so owners without a pseudo are dropped",
      "Season query param validated by zod, defaults to the current Competition Day's season",
      "Service ranks, keeps the top 50, computes me",
      "e2e: two Accounts with attempts rank correctly; a tie shares a rank; a caller with no finalized Attempt gets me null; 401 unauthenticated"
    ],
    "passes": false
  },
  {
    "category": "api",
    "description": "Standing carries allTime",
    "steps": [
      "Repository exposes every finalized day-best score of the owner across seasons",
      "e2e: attempts in two seasons sum into allTime while seasonTotal counts only the current season"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "Seam: profile read, pseudo write, leaderboard read parsed through the contracts",
    "steps": [
      "Request builders and parsers in features/account (profile, pseudo) and features/world (leaderboard), the shape of features/competition/requests.ts",
      "react-query hooks with keys beside their feature's siblings",
      "Builders and parsers covered by vitest like requests.test.ts"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The pseudo Sheet",
    "steps": [
      "Component in features/account/components on the house Sheet: TextInput, one NewButton with pending, French copy in constants",
      "A pure validation helper mirrors the contract and is unit tested",
      "409 shows « Ce pseudo est déjà pris »; other failures show a French error",
      "Success invalidates the profile query and dismisses the Sheet"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "Competition entry gated on the pseudo",
    "steps": [
      "On the Compétition tab, pressing a competition card with a null pseudo opens the Sheet first, then navigates",
      "The competition screen maps PSEUDO_REQUIRED to the Sheet and retries the issuance on success",
      "Signed-out Players see no change"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The leaderboard on the Compétition tab",
    "steps": [
      "Replaces the « Bientôt disponible. » placeholder in features/world",
      "My line card: rank, top %, season total, all-time; below it the top 50 with rank, pseudo, total",
      "House ScreenLoading and ScreenError; an empty season shows French empty copy",
      "The competition cards above stay as they are"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "« Compte » shows the pseudo",
    "steps": [
      "Signed-in: the pseudo, or an invitation to choose one, under the email; tapping opens the Sheet",
      "Anonymous Players see no change"
    ],
    "passes": false
  }
]
```

## Human steps

- After item 1 is committed: `cd apps/api && bun run migration:generate`, commit the migration, then run the ADR 0003 lock SQL on the dashboard for `player_profiles` (RLS on, zero policies, service_role grants).
- Before merging: `NODE_ENV=production bun run migration:run` from `apps/api`.
- After items 9 to 12: design review on device.
