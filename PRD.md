# PRD — Account stats in Profil › Stats

Vocabulary: [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) (Account Stats, Device Stats, Stat Baseline, Stats Transfer, Theme Average, Theme Best, Overall Average, Streak, Attempt, Standing, Season, Category). Rules: [AGENTS.md](AGENTS.md), [apps/api/AGENTS.md](apps/api/AGENTS.md), [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md), [docs/agents/conventions.md](docs/agents/conventions.md), [ADR 0003](docs/adr/0003-database-admits-only-the-api.md), [ADR 0004](docs/adr/0004-competition-answers-are-judged-server-side.md), [ADR 0005](docs/adr/0005-the-api-reaches-its-data-through-typeorm.md), [ADR 0009](docs/adr/0009-season-standings-are-materialized-per-account-at-finalize.md), [mobile ADR 0003](apps/mobile/docs/adr/0003-append-only-session-sync.md).

## Decisions

### What counts as a game

- Practice: only a Finished Quiz Session counts. An Abandoned Session counts nowhere, exactly as the quit dialog promises.
- Competition: an Attempt counts from its issuance, whatever its kind (initial, Replay, Catch-up) and whatever its state. This is the same set as the Competition Streak.
- Every Attempt counts on its own: a Replay is a second game, never a replacement of the first.
- A judged Attempt is a finalized one (completed, quit with its partial score, expired at 0) or a dead one. A dead Attempt is still active but was issued on a Paris day before today, and it counts as a game at 0.
- An Attempt not yet judged (in play, or waiting in the finalize outbox) counts in the game counts, and enters no average and no best until it is judged.
- Every score is out of 50, in practice and in competition.

### The four tiles

- « Parties jouées » holds two figures: the Finished Quiz Sessions (Stat Baselines and pending outbox sessions included) and the Attempts issued.
- « Plus longue série » holds two figures: the Longest Practice Streak and the Longest Competition Streak.
- The Longest Practice Streak is the `longest` of the existing computation: signed in, the Account's Practice Streak merged with the owner's pending outbox days; signed out, the sign-out seed merged with the device's days.
- « Score moyen » is the Overall Average: practice points plus judged competition points, divided by Finished Quiz Sessions plus judged Attempts. It reads « -- » when the Player holds no score.
- « Classement actuel » is the Standing's rank in the current Season, read through the existing Standing read. No new route.
- The rank reads « n°850 ». It reads « -- » with no rank, while the Standing is pending, and when the Standing failed.
- Every average is rounded to the nearest integer, a half going up (34.5 gives 35). The one-decimal format disappears.

### The table « Meilleur score par thème »

- One row per Theme holding at least one game, practice or competition, with three columns: « nb. parties », « meilleur score », « moy. ».
- « nb. parties » is the Theme's Finished Quiz Sessions plus its Attempts issued.
- « meilleur score » is the Theme Best: the highest known score, practice and competition together. Totals recorded without a best contribute none, and it reads « -- » when no best is known.
- « moy. » is the Theme Average: the Theme's practice points plus judged competition points, divided by its sessions plus judged Attempts. It reads « -- » when the Theme holds no score.
- A Theme whose only game is an unjudged Attempt reads 1, « -- », « -- ».
- Rows are grouped by Category. Categories are in alphabetical order, Themes in alphabetical order inside each, in French collation, insensitive to case and accents.
- The phone sorts, since it adds the pending sessions.
- A Theme left without a Category is absent from the table, and its games still count in the tiles. There is no « Autres » group.

### Signed out

- The screen is the same. The practice figures come from the Device Stats: games played, Overall Average, Longest Practice Streak and the table rows.
- The three competition figures read « -- »: competition games played, Longest Competition Streak and rank.
- Only the « -- » itself is pressable, and it opens the sign-in sheet. A new minimal component may carry it.
- Signed in, no figure is pressable.
- A dormant device world (declined Stats Transfer) stays hidden while signed in.

### API

- `GET /app/me/stats` stays the one read. It answers `themes`, `practiceStreak` and `competitionStreak`.
- A `themes` row holds `themeId`, `themeName`, `category` (nullable), `practice: { sessionCount, totalPoints, bestScore }` and `competition: { attemptCount, judgedCount, totalPoints, bestScore }`. Both `bestScore` are nullable.
- No total travels: the phone derives the four tiles and the table from the rows alone.
- The database is the primary source of a Theme's name and Category. Each row is joined to its Theme and Category, published or not.
- A Theme the Editor deleted keeps its most recently captured name and a null `category`.
- Practice tallies are the Account's Quiz Sessions plus its Stat Baselines. The practice `bestScore` is the highest of the session points and of the baselines' known bests.
- The sums are computed by the database. Whole Quiz Sessions never travel.
- The stats read finalizes nothing. A dead Attempt is counted as judged at 0 by the tally, from today's Paris date, with the clock injected.
- Another Account's rows never count.
- `stat_baselines` gains a nullable `best_score`. `POST /app/me/stat-baselines` takes a `bestScore` (an integer from 0 to 50, or null) on each baseline and stores it. Insert-if-absent is unchanged.
- The contract is transitional during the loop: `themes` lands beside `baselines` and `sessions[]`, which leave in the last item once the phone stops reading them. Every commit keeps `check` green.
- No compatibility with installed builds: no versioning, no shim.

### Mobile

- The Stats tab derives everything from one list of tallies, the same shape in both worlds: the Account's `themes` overlaid with the pending outbox sessions, or the Device Stats.
- A pending outbox session folds into its Theme's `practice` (count, points, best). It creates the row when the Account holds none for that Theme.
- An outbox entry captures its Category at enqueue, so a Theme played for the first time shows in the table before its push lands. The Category never goes on the wire.
- The dedupe by session id is gone. When a push is acked, the acked sessions fold into the cached tallies, then the Account stats are invalidated.
- A read landing between the server insert and the ack may count a session twice until the next read. This is accepted.
- The competition figures come from the server alone. The phone overlays no Attempt, so none is ever counted twice.
- Issuing an Attempt invalidates the Account stats, as a finalize already does.
- The Device Stats record, per Theme, the best score and the Category captured at record time, beside the name and the totals.
- A Device Stats entry recorded before this work holds neither: its best is unknown, and its Category comes from the catalog or not at all.
- Signed out, the tab reads the catalog itself. The catalog's Category wins when the catalog holds the Theme, the captured one otherwise.
- The Stats Transfer deposits each Theme's best score with its baseline, null when unknown.
- The persisted query cache's buster changes, so stats in the old shape are dropped at hydration.
- The old Theme card list, its hook, the fold over raw sessions and the one-decimal format are deleted.

### Screen

- Ralph delivers the right figures in the mockup's structure. Hugo restyles the screen afterwards to match the design.
- The order is: `PremiumBanner` and `TransferNotice` unchanged on top, the four tiles in a 2×2 grid, then the table card grouped under a Category pill.
- Existing primitives and tokens only. No new `TEXT` token, colour or asset.
- The existing medal image marks the competition figures. The existing flame image decorates « Plus longue série ».
- With zero game: the counts read 0, the Longest Streaks read 0, the Overall Average and the rank read « -- », and « Aucune statistique pour le moment. » replaces the table.
- Signed in with no cache: `ScreenLoading` while the stats are pending, `ScreenError` with a retry when they failed. The Standing never blocks the screen.
- The copy is French, in the account feature's constants.

### Test seams

- API pure function: a vitest spec beside `streak.spec.ts`.
- API repository reads: `player.repository.spec.ts`, with its metadata DataSource and mocked query runner.
- API routes: `app-me.e2e-spec.ts`, through the Nest testing module and its fake repository, today injected.
- Contracts: `account.spec.ts`.
- Mobile pure functions and stores: vitest beside `stats.test.ts`, `account-stats.test.ts`, `outbox.test.ts` and `stats-transfer.test.ts`. No component rendering test. Today is always injected.

### Out of scope

- The header's « Alias » line, the third tab's label (it stays « Compte »), and the Historique tab with its future paginated route.
- Matching the mockup's pixels, and any new design token.
- A pressable rank leading to the Leaderboard, past Seasons and a best rank.
- Any change to curation: deleting a played Theme stays possible.
- Compatibility with installed builds and with data recorded before this work.

## Items

```json
[
  {
    "category": "api",
    "description": "StatBaselineEntity gains a nullable bestScore",
    "steps": [
      "The entity carries bestScore: integer, nullable, column best_score, in the shape of its sibling columns",
      "No migration file is written, generated or edited",
      "schema-constraints.spec.ts still passes",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "contracts",
    "description": "The Account stats carry per-Theme tallies, and a Stat Baseline push carries its best score",
    "steps": [
      "A Theme tally schema: themeId, themeName, category (appCategorySchema or null), practice { sessionCount, totalPoints, bestScore }, competition { attemptCount, judgedCount, totalPoints, bestScore }",
      "Counts and points are non-negative integers; bestScore is an integer from 0 to 50, or null",
      "A tally whose judgedCount exceeds its attemptCount is rejected; so is a tally holding no game (sessionCount + attemptCount = 0)",
      "appAccountStatsResponseSchema gains themes, beside baselines and sessions which stay until the last item",
      "Each row of appStatBaselinePushInputSchema gains bestScore: an integer from 0 to 50, or null; a missing bestScore is rejected",
      "Specs in account.spec.ts parse a valid payload and reject each case above, a bestScore of 51 and a malformed category",
      "The API answers themes: [] until the route item lands; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "Pure function from an Account's per-Theme sums and Attempts to its tallies",
    "steps": [
      "Two sessions of 30 and 40 plus a baseline of 3 sessions, 90 points and best 45 give practice { sessionCount: 5, totalPoints: 160, bestScore: 45 }",
      "A baseline with a null best and no session gives practice bestScore null; beside a session of 20 it gives 20",
      "Finalized Attempts completed at 35, quit at 10 and expired at 0 on one Theme give competition { attemptCount: 3, judgedCount: 3, totalPoints: 45, bestScore: 35 }",
      "An active Attempt issued on an earlier Paris day counts as judged at 0; one issued today counts in attemptCount alone",
      "A Theme whose only game is an unjudged Attempt gives attemptCount 1, judgedCount 0, bestScore null",
      "A Theme holding no game gives no tally",
      "Free of TypeORM, today injected; vitest spec beside streak.spec.ts; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "GET /app/me/stats carries themes, each joined to its Theme and Category",
    "steps": [
      "Unauthenticated: 401",
      "themes holds one row per Theme the owner has a Quiz Session, a Stat Baseline or an Attempt on; another Account's rows never count",
      "Each row carries the Theme's current name and its Category from the database, for a published and an unpublished Theme alike",
      "A Theme deleted from the catalog keeps its most recently captured name and a null category",
      "The sums are grouped by Theme in SQL and filtered by owner; the repository spec asserts both",
      "An active Attempt issued yesterday (Paris) is answered as judged at 0, and the read finalizes nothing",
      "Repository specs in player.repository.spec.ts; e2e in app-me.e2e-spec.ts parses the response through the contract, today injected",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "POST /app/me/stat-baselines stores the deposited best score",
    "steps": [
      "A baseline pushed with bestScore 45 is stored with it; one pushed with null is stored null",
      "A replayed push changes nothing, bestScore included",
      "bestScore 51, negative or missing: 400 through the ErrorResponse envelope",
      "GET /app/me/stats then answers the deposited best in the Theme's practice bestScore",
      "e2e in app-me.e2e-spec.ts; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "Pure stats functions: the four tiles and the table from a list of tallies",
    "steps": [
      "Games played: practice is the sum of sessionCount, competition the sum of attemptCount, unjudged Attempts included",
      "Overall Average: 230 sessions totalling 8000 points and 10 judged Attempts totalling 400 give 35; 34.5 gives 35; no score gives null",
      "Table row: nb. parties = sessionCount + attemptCount; Theme Best = the highest known best, null when none; Theme Average over sessionCount + judgedCount, null at 0",
      "A Theme whose only game is an unjudged Attempt gives 1, null, null",
      "Groups: Categories alphabetical, Themes alphabetical inside, French collation insensitive to case and accents (« Écologie » before « Histoire »)",
      "A tally without a Category is absent from the groups and still counted by the tiles",
      "In the signed-out world the competition figures are null, never 0",
      "Vitest beside stats.test.ts; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "Device Stats record each Theme's best score and Category, and the Stats Transfer deposits the best score",
    "steps": [
      "A signed-out Finished Quiz Session raises the Theme's best when its points are higher, and records the Theme's Category",
      "An Abandoned Session records nothing",
      "An entry persisted before this item reads with an unknown best and no captured Category, without a crash",
      "Device Stats fold into tallies: practice from the device, competition empty",
      "The catalog's Category wins when the catalog holds the Theme, the captured one otherwise, none when neither knows it",
      "buildTransferBaselines carries each Theme's bestScore, null when unknown",
      "Vitest beside stats.test.ts and stats-transfer.test.ts; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The Account world reads tallies: pending sessions overlay them, an ack seeds then invalidates, an issuance invalidates",
    "steps": [
      "The Account tallies are the stats' themes overlaid with the owner's pending outbox sessions: count, points and best move",
      "A pending session on a Theme the Account lacks creates the row, with the entry's captured Category",
      "An outbox entry captures its Category at enqueue, and the push body never carries it",
      "An ack folds the acked sessions into the cached themes, then invalidates the Account stats; with no cache loaded it seeds nothing",
      "The acked days still extend the cached Practice Streak",
      "Issuing an Attempt invalidates the Account stats, and the phone overlays no Attempt",
      "The persisted query cache's buster is no longer api-v1",
      "Pure logic under vitest beside account-stats.test.ts and outbox.test.ts; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "Profil › Stats shows the four tiles and the table, signed in or out",
    "steps": [
      "PremiumBanner and TransferNotice stay on top, unchanged",
      "Four tiles in a 2×2 grid: « Parties jouées », « Plus longue série », « Score moyen », « Classement actuel »",
      "Then the card « Meilleur score par thème », columns « nb. parties », « meilleur score », « moy. », rows grouped under a Category pill",
      "Signed in: every figure comes from the Account tallies, the Streaks and the Standing, and no figure is pressable",
      "The rank reads « n°850 », and « -- » with no rank or while the Standing is pending or failed",
      "Signed out: practice figures come from the Device Stats; the three competition figures read « -- », and each « -- » alone opens the sign-in sheet",
      "Zero game: counts 0, Longest Streaks 0, Overall Average « -- », and « Aucune statistique pour le moment. » in place of the table",
      "Signed in with no cache: ScreenLoading while pending, ScreenError with a retry on failure",
      "Scores read as integers over 50; the medal image marks competition figures, the flame image sits on « Plus longue série »; existing tokens and primitives only",
      "HomeThemeCard, useHomeCards, the fold over raw sessions and formatAverage are gone; nothing on the phone reads baselines or sessions",
      "bun run check green"
    ],
    "passes": false
  },
  {
    "category": "contracts",
    "description": "baselines and sessions[] leave the Account stats, in the contract and the API",
    "steps": [
      "appAccountStatsResponseSchema holds themes, practiceStreak and competitionStreak, and nothing else",
      "The API reads no whole Quiz Session and no whole Stat Baseline to answer the stats",
      "e2e: the response carries no baselines key and no sessions key",
      "Specs updated in account.spec.ts and app-me.e2e-spec.ts; bun run check green"
    ],
    "passes": false
  }
]
```

## Human steps

- After item 1: Hugo runs `bun run migration:generate` then `bun run migration:run` in `apps/api`, before items 4 and 5 meet a real database. No lock SQL is needed, since `best_score` joins a table that is already locked.
- After item 10: a device review in both auth states — the four tiles, the table, each « -- » opening the sign-in sheet, a session finished offline showing at once, and an Attempt counted right after its issuance.
- After the review: Hugo restyles the screen to match the design.
