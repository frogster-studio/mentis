# PRD — Practice and Competition Streaks

Vocabulary: [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) (Streak, Device Stats, Stats Transfer, Stat Baseline, Attempt, Catch-up, Competition Day). Rules: [AGENTS.md](AGENTS.md), [apps/api/AGENTS.md](apps/api/AGENTS.md), [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md), [docs/agents/conventions.md](docs/agents/conventions.md), [ADR 0003](docs/adr/0003-database-admits-only-the-api.md), [ADR 0004](docs/adr/0004-competition-answers-are-judged-server-side.md), [ADR 0005](docs/adr/0005-the-api-reaches-its-data-through-typeorm.md).

## Decisions

### Streak rules

- A day is the Europe/Paris calendar date, for both Streaks, whatever the Player's timezone.
- Two independent Streaks: a practice day never feeds the Competition Streak, and a competition day never feeds the Practice Streak.
- A practice day is a day holding at least one Finished Quiz Session. Abandoned Sessions never count. Several sessions on one day count once.
- A competition day is a day holding at least one Attempt of the Account, whatever its status or finalize reason (active, completed, quit, expired). The day is the Attempt's Competition Day, so a Catch-up mends yesterday. A Replay adds nothing.
- A Streak on the wire is `{ lastDay: date | null, length: int, longest: int }`. `length` is the run of consecutive days ending at `lastDay`, `longest` the longest run ever, and all three are null/0/0 with no day.
- The displayed Streak is the current one: `length` when `lastDay` is today or yesterday, otherwise 0. The phone computes it with its own clock, so a cached read never goes stale across midnight.

### API

- `GET /app/me/stats` becomes the Account's record, the one read home, Monde and Profil share. It keeps `baselines` and `sessions` and gains `practiceStreak` and `competitionStreak`. No streak goes on `standing` (Season-scoped), `competition/day` or the public Leaderboard.
- Practice days are the Paris dates of the Account's `quiz_sessions.finished_at`, unioned with its `practice_days.day`. Competition days are the distinct `competition_attempts.day` of the Account.
- The repository returns distinct days; one pure function turns sorted distinct days into `{ lastDay, length, longest }`.
- A new `practice_days` table holds the days a Stats Transfer deposits: `owner`, `device`, `day`, `unique(owner, device, day)`, cascading from `auth.users`. The entity copies `theme.entity.ts`.
- `POST /app/me/practice-days` takes an array of at most `MAX_PUSH_BATCH` `{ device, day }` and answers 204 with no body. A replayed push adds nothing, an empty array is a no-op, no token is 401, and a deleted Account is 410 `ACCOUNT_GONE`, exactly like `stat-baselines`.
- The later Profile stats (games played, Longest Streak, best rank, best score per Theme) land on the same `GET /app/me/stats`. Their work will replace the raw `sessions[]` with server-side per-Theme aggregates. `longest` ships now for the « Plus longue série » tile.

### Mobile

- Signed in, the Practice Streak is the Account's `practiceStreak` merged with the Paris days of the Player's pending outbox sessions, so a session finished offline extends it at once.
- Signed out, the Device Stats also record the Paris day of every Finished Quiz Session.
- At sign-out, the device keeps a seed: the Practice Streak displayed at that moment, outbox overlay included. If the Account stats were never loaded, the seed is cleared, so a Player never inherits another Account's Streak. Account deletion clears the seed.
- Signed out, the Practice Streak is the seed's days (the `length` days ending at its `lastDay`) unioned with the device's practice days; `longest` is the max of the seed's and the computed one. With no seed, it is the device days alone. Scenario that must hold: Account Streak 5, sign out, 3 consecutive days played, the Streak is 8. Sign in, accept the transfer, the Streak is still 8.
- One pure merge function (a Streak plus a set of days gives a Streak) serves the outbox overlay, the seed and the device. A second pure function gives the current Streak for a Paris date `today`, and a third gives the Paris date of an instant.
- The Stats Transfer pushes the device's practice days to `POST /app/me/practice-days` in batches, beside the baselines. The device world empties only once both pushes land. A declined transfer leaves the days dormant with the rest of the Device Stats.
- A finalize also invalidates `accountKeys.stats`, since the Competition Streak moves with every Attempt.
- The home practice card shows the Practice Streak, signed in or out. The Monde competition card shows the Competition Streak. The badge shows 0 as a number and is never hidden. No « at risk » state.
- The badge's accessibility label reads « Série : N jours », with « Série : 1 jour » when N is 1. The copy stays in the competition feature's `constants.ts`.
- `StreakBadge` stays in `features/account/components/`, since it is only lightly edited.

### Test seams

- API pure function: vitest spec beside `day-offers.spec.ts` / `leaderboard.spec.ts`.
- API repository reads: specs in the manner of `standing.repository.spec.ts`.
- API routes: `app-me.e2e-spec.ts` through the Nest testing module.
- Contracts: the package's `*.spec.ts`, beside `account.spec.ts`.
- Mobile pure functions and stores: vitest, beside `stats.test.ts`, `outbox.test.ts` and `stats-transfer.test.ts`. The clock and today are always injected.

### Out of scope

- The Profile stats tiles and their data (games played, Longest Streak display, average score, best rank, best score per Theme), and reshaping `sessions[]` into aggregates.
- An « at risk » or grey-flame state, streak notifications, streak freezes.
- A Streak for any timezone but Europe/Paris.

## Items

```json
[
  {
    "category": "api",
    "description": "PracticeDayEntity: the days a Stats Transfer deposits under an Account",
    "steps": [
      "src/_database/entities/practice-day.entity.ts copies theme.entity.ts: BaseEntity, generated uuid id, owner uuid, device uuid, day date, created/updated columns",
      "@Unique(owner, device, day) on the entity; ManyToOne AuthUserEntity with onDelete CASCADE on owner",
      "Registered wherever the other entities are; no migration file is written or generated",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "contracts",
    "description": "Streak schema on the Account stats response, and the practice-days push input",
    "steps": [
      "A streak schema { lastDay: iso date | null, length: int >= 0, longest: int >= length }",
      "appAccountStatsResponseSchema gains practiceStreak and competitionStreak",
      "appPracticeDayPushInputSchema: array of { device: uuid, day: iso date }, max MAX_PUSH_BATCH",
      "Specs parse a valid payload and reject a longest below length, a bad date and an oversized batch",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "Pure function from distinct days to { lastDay, length, longest }",
    "steps": [
      "No day: { lastDay: null, length: 0, longest: 0 }",
      "Days 01, 02, 03, 05: { lastDay: 05, length: 1, longest: 3 }",
      "A run crossing a month and a year boundary counts as one run",
      "Unsorted or duplicated input gives the same result as sorted distinct input",
      "Vitest spec beside day-offers.spec.ts; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "GET /app/me/stats carries practiceStreak and competitionStreak",
    "steps": [
      "Practice days: Paris dates of the Account's quiz_sessions.finished_at unioned with its practice_days.day; two sessions on one Paris day count once",
      "A session finished at 23:30 UTC on 2026-03-31 (01:30 Paris) counts for 2026-04-01",
      "Competition days: distinct competition_attempts.day of the Account, every status and finalize reason included",
      "Another Account's rows never count",
      "Repository specs in the manner of standing.repository.spec.ts; e2e in app-me.e2e-spec.ts parses the response through the contract",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "POST /app/me/practice-days deposits a Stats Transfer's practice days",
    "steps": [
      "Unauthenticated: 401",
      "Valid batch: 204 and the rows stored under the token's owner",
      "The same batch sent twice stores each (owner, device, day) once",
      "Empty array: 204, nothing written",
      "Oversized or malformed body: 400 through the ErrorResponse envelope",
      "Deleted Account: 410 ACCOUNT_GONE, as stat-baselines",
      "e2e in app-me.e2e-spec.ts; bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "Pure streak functions: Paris date, current Streak, merge of a Streak and days",
    "steps": [
      "parisDay of an ISO instant: 2026-03-31T23:30:00Z gives 2026-04-01",
      "currentStreak: length when lastDay is today or yesterday, 0 when older or null",
      "mergeStreak({ lastDay: D, length: 5, longest: 5 }, [D+1, D+2, D+3]) gives { lastDay: D+3, length: 8, longest: 8 }",
      "mergeStreak with days already inside the Streak changes nothing; a gap starts a new run and keeps longest",
      "mergeStreak(null, days) computes from the days alone",
      "Vitest, today injected; bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "Device Stats record practice days and the Stats Transfer pushes them",
    "steps": [
      "A signed-out Finished Quiz Session records its Paris day once in the Device Stats; an Abandoned Session records nothing",
      "The transfer pushes the device's practice days to POST /app/me/practice-days in MAX_PUSH_BATCH batches, beside the baselines",
      "The device world (stats and days) empties only after both pushes land; a failed push leaves it untouched",
      "A declined transfer leaves the days dormant",
      "Vitest on the store and transfer logic; bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The sign-out seed carries the Account's Practice Streak into the signed-out world",
    "steps": [
      "Sign-out writes the displayed Practice Streak (Account merged with the outbox overlay) as the seed",
      "Sign-out with no loaded Account stats clears the seed",
      "Account deletion clears the seed",
      "Signed out: Practice Streak = mergeStreak(seed, device days); no seed: device days alone",
      "Scenario spec: seed length 5 ending D, device days D+1..D+3, displayed Streak 8",
      "Vitest; bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "Streak hooks, and the finalize invalidates the Account stats",
    "steps": [
      "usePracticeStreak: signed in, the Account practiceStreak merged with the owner's pending outbox days; signed out, the seed-and-device Streak; both through currentStreak for today",
      "useCompetitionStreak: the Account competitionStreak through currentStreak; nothing signed out",
      "pushFinalize invalidates accountKeys.stats beside day, standing and leaderboard",
      "The merge and selection logic is a pure function under vitest; bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The badges show the real Streaks with a counted accessibility label",
    "steps": [
      "The home practice card's StreakBadge shows the Practice Streak, signed in or out, 0 included",
      "The Monde competition card's StreakBadge shows the Competition Streak, 0 included",
      "No hardcoded 45 and no hardcoded « Série : 3 jours » remains",
      "Accessibility label « Série : N jours », « Série : 1 jour » at 1, built from constants in the competition feature",
      "bun run check green"
    ],
    "passes": false
  }
]
```

## Human steps

- After item 1: Hugo runs `bun run migration:generate` then `bun run migration:run` in `apps/api`, before items 4 and 5 meet a real database.
- Right after the migration: lock the new table on the Supabase dashboard, per ADR 0003 (default privileges already keep `anon` and `authenticated` out):

  ```sql
  -- Born locked: RLS on and zero policies, so only the owning role the API connects as reaches it.
  alter table public.practice_days enable row level security;
  ```

- After item 10: a device review on the simulator — both badges, the 5 → 8 → 8 sign-out and transfer scenario, and a session finished offline extending the Practice Streak at once.
