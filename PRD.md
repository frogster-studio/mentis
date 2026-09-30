# PRD — History in Profil › Historique

Vocabulary: [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) (History, Quiz Session, Abandoned Session, Attempt, Competition Session, Competition Day, Theme, Category, Account, Player, Account Stats, Device Stats, Stats Transfer). Rules: [AGENTS.md](AGENTS.md), [apps/api/AGENTS.md](apps/api/AGENTS.md), [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md), [docs/agents/conventions.md](docs/agents/conventions.md), [ADR 0003](docs/adr/0003-database-admits-only-the-api.md), [ADR 0004](docs/adr/0004-competition-answers-are-judged-server-side.md), [ADR 0005](docs/adr/0005-the-api-reaches-its-data-through-typeorm.md), [mobile ADR 0003](apps/mobile/docs/adr/0003-append-only-session-sync.md).

## Decisions

### What the History holds

- A practice line is a Finished Quiz Session, the only kind `quiz_sessions` stores; an Abandoned Session never reaches the API.
- A competition line is a finalized Attempt whatever its finalize reason: completed, quit with its partial score, expired at 0. It is the set the Account Stats count as judged.
- An Attempt still active never appears: in play, waiting in the finalize outbox, or dead on an earlier Competition Day but not yet zero-finalized. It has no score.
- A Finished Quiz Session waiting in the outbox never appears: the History is server truth alone; the ack invalidates the read and the line appears then.
- Signed out, the History is empty: a device keeps no list of its sessions, only per-Theme aggregates.

### The line

- One wire shape for both kinds: `{ id, type, themeId, themeName, category, score, questionCount, durationMs, playedAt }`.
- `id` is the Quiz Session id (phone-minted) or the Attempt id.
- `type` is `SessionTypeEnum`, `PRACTICE` or `COMPETITION`, in `packages/contracts/src/enums/session-type.enum.ts` (UPPERCASE keys and values, per conventions). Named `type`, never `kind`: `kind` is the Attempt's initial / replay / catchup and stays off the History.
- `themeName` is the name captured when the session was played (the row's own column), never the current catalog name.
- `category` is the Theme's current Category (`appCategorySchema`: id, name, color, secondaryColor, icon), read through the existing `findThemesWithCategory`, published or withdrawn alike; null when the Editor deleted the Theme.
- `score` is the Quiz Session's `points` or the Attempt's `score`: a non-negative integer with no /50 cap on the wire, the line's `questionCount` is its scale.
- `questionCount`: competition reads `questionIds.length`; practice reads the new `question_count` column.
- `durationMs`: competition is the sum of the Attempt's answers' `clientElapsedMs` (the play time, Theme Reveal and outbox delay excluded), null when no answer carries one (an expired Attempt); practice is always null, nothing is stored. Never `finalizedAt − issuedAt`.
- `playedAt`: practice `finishedAt`, competition `issuedAt` (when the Player started), ISO with offset. Never `finalizedAt`, never the Competition Day: a Catch-up played today sits under today.

### The question count column

- `QuizSessionEntity` gains `questionCount` as `@Column({ type: "smallint", name: "question_count", default: 10 })`: every session before the column was a 10-Question one, and the generated migration fills existing rows through the default.
- `appQuizSessionPushInputSchema` requires `questionCount` (integer ≥ 1); the API stores it; a body without it is 400.
- `QUIZ_SESSION_QUESTION_COUNT = 10` lives in the contracts beside the push schema; mobile's `QUESTIONS_PER_SESSION` is that constant, one source.
- The outbox entry captures `questionCount` at enqueue, like the Theme name and the Category; the push sends it.
- A variable question count later also changes the /50 scale of every average: a separate decision, not this PRD.

### Pagination

- `GET /app/me/history?before=<ISO datetime>`, guarded by `SupabaseUserGuard` + `AuthenticatedThrottlerGuard` like every `/app/me` route; unauthenticated is 401.
- `before` is optional: absent reads the newest page; present, every line has `playedAt` strictly before it. It is validated through `ZodValidationPipe` on `@Query`, like the Leaderboard's page.
- The response is `{ sessions, nextBefore }`: at most `HISTORY_PAGE_SIZE = 20` lines newest first; `nextBefore` is the page's last `playedAt` when more may exist, null when the History ends.
- Two owner-scoped reads per page, each ordered desc and limited to the page size: Quiz Sessions by `finishedAt`, finalized Attempts by `issuedAt`. A pure function merges them newest first and cuts at the page size.
- `nextBefore` is null only when both reads returned fewer than a page; otherwise it is the page's last `playedAt`. Lines cut from the merge are re-read by the next page.
- Two lines of one Account inside the same millisecond would lose the older one to the strict cursor: accepted, an Account cannot play two sessions in one millisecond.
- No new index: `quiz_sessions_owner_idx` and `competition_attempts_owner_day_idx` serve; an Account holds a few hundred lines.
- The service parses the payload through `appHistoryPageResponseSchema`, so `owner` and every unlisted column stay off the wire.

### Mobile read

- `useHistory(playerId)` is a `useInfiniteQuery` keyed `accountKeys.history(playerId)` under `ACCOUNT_QUERY_ROOT`, so every loaded page persists and reads offline like the Stats; enabled only signed in; default `STALE_TIME_MS`.
- `initialPageParam` is undefined; `getNextPageParam` returns `nextBefore`, or undefined when it is null.
- The request goes through the seam (`api.requestJson` with `query: { before }`), parsed by the contract schema, in `features/account/requests.ts`.
- Invalidated on the Quiz Session outbox ack (`outbox-sync.ts`, beside the stats) and on the finalize ack (`finalize-sync.ts`); a Stats Transfer deposits baselines, never a line, so `transfer-sync.ts` is untouched. A focus refetches only what is stale.
- An invalidated infinite query refetches its loaded pages in order: accepted.

### The screen

- `history.tsx` is the page itself. The list is a `SectionList`, one section per calendar day of the device, `stickySectionHeadersEnabled={false}`, no scroll indicator, width capped by `MAX_CONTENT_WIDTH`, content padded `SPACE.lg` top, `GUTTER` sides and `tabBarHeight + SPACE.lg` bottom, like the Stats page.
- `onEndReached` calls `fetchNextPage` only while `hasNextPage && !isFetchingNextPage`, `onEndReachedThreshold` 0.5; the list footer is an `ActivityIndicator` in `COLORS.primary` while the next page loads, nothing otherwise.
- Day heading: « Aujourd'hui », « Hier », otherwise `Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" })` (« lundi 28 septembre »), the year appended when the day is outside the current year. Computed by a pure `historySections(sessions, today)`, the clock injected.
- A line shows the Theme name, the Category label (icon + name on the Category color: the `CategoryLabel` extracted from `theme-stats-table.tsx` into `src/components/account/category-label.tsx`; none when `category` is null), the score through `scoreFigure` (« 35/50 »), the medal image for a competition line as `StatFigure` does, « 10 questions », and the duration through `durationFigure` when known, nothing when null.
- `durationFigure(ms)`: « 2 min 13 s », « 45 s » under a minute, « 1 min » on a whole minute, seconds rounded down; in `stat-figures.ts`.
- A line has no tap in this version.
- States: signed out → caption « Connecte-toi pour retrouver ton historique. » with no action (the header chip signs in); pending → `ScreenLoading`; failed with no data → `ScreenError` « Impossible de charger ton historique. » with `onRetry`; success with no line → caption « Aucune partie pour le moment. ». Captions in `TEXT.caption`, `COLORS.inkMuted`, centered, like `PROFILE_STATS_EMPTY`.
- Copy in `features/account/constants.ts`, French, SCREAMING_SNAKE_CASE; the tab label stays `PROFILE_HISTORY_TAB_LABEL`.
- Colors only from `COLORS`, text styles only from `TEXT`, spacing from `SPACE`/`GUTTER`; rounded surfaces as the siblings in `src/components/account/` do. Hugo restyles the line after the device review.

### Areas to include

- Contracts: the `SessionTypeEnum`, the History query and page schemas, the push schema, the question-count and page-size constants, their specs.
- API player feature: the `QuizSessionEntity` column, the repository reads, the pure page merge in `utils/`, the service and mapper, the `/app/me/history` controller route, the push mapping.
- Mobile account feature: the seam request, the infinite query hook and its key, the pure sections and figures, the copy, the invalidations in the quiz outbox sync and the competition finalize sync, the outbox entry's question count.
- Mobile account components: the row, the section header, the extracted Category label, and the « Historique » page.

### Test seams

- Contracts: `packages/contracts/src/app/history.spec.ts` and `account.spec.ts`, after `competition.spec.ts` (page-size cap, nullable fields, `owner` stripped).
- API pure merge: `src/player/_tests/history-page.spec.ts`, after `theme-tallies.spec.ts`.
- API repository SQL: the metadata harness of `src/player/_tests/player.repository.spec.ts`, checking the owner filter, the status filter, the order, the limit and the elapsed sum.
- API route: `src/player/_tests/app-me.e2e-spec.ts` through the Nest testing module, the fake `PlayerRepository` rows and minted JWTs, as every `/app/me` test.
- Mobile seam: `features/account/requests.test.ts` (path, `before` query, parsed page), after the profile tests.
- Mobile pure: `history-sections.test.ts`, `stat-figures.test.ts`, `outbox.test.ts` — vitest on pure TS, no component rendering.

### Out of scope

- Sorting, filtering, a tap on a line, the competition transcript, the Attempt kind on the wire, an overlay of pending outbox sessions, a device-side History, a new index, the practice duration, the /50 scale for a variable question count, FlashList.

## Items

```json
[
  {
    "category": "api",
    "description": "QuizSessionEntity gains questionCount (question_count, smallint, default 10)",
    "steps": [
      "quiz-session.entity.ts declares questionCount: number as @Column({ type: \"smallint\", name: \"question_count\", default: 10 }), in the shape of theme.entity.ts, no `!`",
      "No migration file is added or edited; bun run typecheck and bun run test stay green in apps/api",
      "bun run check green at the repo root"
    ],
    "passes": true
  },
  {
    "category": "contracts",
    "description": "The Quiz Session push carries questionCount, stored by the API and sent by the mobile outbox",
    "steps": [
      "packages/contracts/src/app/account.ts exports QUIZ_SESSION_QUESTION_COUNT = 10 and appQuizSessionPushInputSchema requires questionCount as an integer ≥ 1; account.spec.ts refuses a session without it and one with 0",
      "POST /app/me/quiz-sessions stores questionCount on the row: PlayerService.pushQuizSessions maps it, the e2e fake rows carry it, every session fixture in app-me.e2e-spec.ts sends it",
      "apps/mobile: QUESTIONS_PER_SESSION is QUIZ_SESSION_QUESTION_COUNT from the contracts; OutboxEntry carries questionCount, captured at enqueue in app/session/[themeId].tsx; the push batch sends it; outbox.test.ts and batch-push.test.ts fixtures carry it",
      "bun run check green at the repo root"
    ],
    "passes": true
  },
  {
    "category": "contracts",
    "description": "The History contract: SessionTypeEnum, HISTORY_PAGE_SIZE, the query and the page schemas",
    "steps": [
      "packages/contracts/src/enums/session-type.enum.ts exports SessionTypeEnum { PRACTICE = \"PRACTICE\", COMPETITION = \"COMPETITION\" }, re-exported by enums/index.ts",
      "packages/contracts/src/app/history.ts exports HISTORY_PAGE_SIZE = 20, appHistoryQuerySchema ({ before: ISO datetime with offset, optional }), appHistoryPageResponseSchema ({ sessions: lines, max HISTORY_PAGE_SIZE; nextBefore: ISO datetime with offset, nullable }) and the types AppHistoryQuery, AppHistoryPageResponse, AppHistorySession; app/index.ts re-exports it",
      "A line parses as { id: uuid, type: SessionTypeEnum, themeId: non-empty string, themeName: non-empty string, category: appCategorySchema nullable, score: integer ≥ 0, questionCount: integer ≥ 1, durationMs: integer ≥ 0 nullable, playedAt: ISO datetime with offset }; an owner key is stripped",
      "history.spec.ts: 21 lines fail, a query without before parses to no before key, nextBefore null parses, a line with owner loses it, a line with durationMs null and one with a number both parse",
      "bun run check green at the repo root"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "Pure historyPage merges practice and competition lines newest first, cuts at the page size and names nextBefore",
    "steps": [
      "src/player/utils/history-page.ts exports historyPage(practice: AppHistorySession[], competition: AppHistorySession[], size: number): { sessions: AppHistorySession[]; nextBefore: string | null }, TypeORM-free",
      "12 practice + 8 competition lines, size 20: 20 lines ordered by playedAt desc, nextBefore null",
      "20 practice + 3 competition lines, size 20: 20 lines, nextBefore is the 20th line's playedAt, every cut line is older than or equal to it",
      "Both empty: [] and null; 20 competition + 0 practice: nextBefore is the 20th playedAt",
      "src/player/_tests/history-page.spec.ts covers the four cases; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "PlayerRepository reads a page of Quiz Sessions and of finalized Attempts before an instant, each Attempt with its summed elapsed",
    "steps": [
      "findQuizSessionsBefore(owner, before: Date | null, limit): QuizSessionEntity[] — owner filter, finishedAt < before when given, ORDER BY finishedAt DESC, LIMIT limit, whole entities",
      "findFinalizedAttemptsBefore(owner, before: Date | null, limit): { entity: CompetitionAttemptEntity; durationMs: number | null }[] — owner filter, status = 'finalized', issuedAt < before when given, ORDER BY issuedAt DESC, LIMIT limit; durationMs is SUM(competition_answers.client_elapsed_ms) per Attempt, null when every answer's is null, read as a number never a string",
      "src/player/types/ holds the aggregate type composing the entity, no flat restatement of its columns",
      "player.repository.spec.ts: the generated SQL carries the owner parameter, the status filter, the order, the limit and the elapsed sum; a null before emits no cursor predicate",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "GET /app/me/history answers one page of the Account's History",
    "steps": [
      "Unauthenticated: 401 UNAUTHENTICATED envelope; a before that is not an ISO datetime: 400",
      "MeController.history(@Query ZodValidationPipe(appHistoryQuerySchema)) → PlayerService.history(owner, query): the two repository reads in parallel with HISTORY_PAGE_SIZE, historyPage, then findThemesWithCategory on the page's themeIds; the mapper assembles the lines and parses appHistoryPageResponseSchema",
      "No line: { sessions: [], nextBefore: null }",
      "A practice line: type PRACTICE, score = points, questionCount = the row's, durationMs null, playedAt = finishedAt, themeName = the captured name, category = the current Theme's Category",
      "A completed Attempt: type COMPETITION, score, questionCount = questionIds.length, durationMs = the answers' sum, playedAt = issuedAt; an expired one: score 0, durationMs null; a quit one: its partial score",
      "An active Attempt, a dead one not yet zero-finalized, and another Player's rows never appear; a deleted Theme's line carries category null and its captured name",
      "21 lines newest first across both kinds: the first call answers 20 with nextBefore = the 20th playedAt; ?before=<that> answers the 21st with nextBefore null; owner never on the wire",
      "app-me.e2e-spec.ts covers each case through the Nest testing module with the fake PlayerRepository; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "useHistory reads the History through the seam as an infinite query, invalidated by both acks",
    "steps": [
      "features/account/requests.ts exports fetchHistoryPage(api, before: string | undefined): GET /app/me/history with query { before }, parsed by appHistoryPageResponseSchema; requests.test.ts proves the path, that an undefined before sends no query string, and the parsed page",
      "features/account/api.ts exports accountKeys.history(playerId) under ACCOUNT_QUERY_ROOT and useHistory(playerId: string | undefined): useInfiniteQuery enabled signed in only, initialPageParam undefined, getNextPageParam = page.nextBefore ?? undefined, default staleTime",
      "outbox-sync.ts invalidates accountKeys.history(playerId) beside the stats on a Quiz Session ack; finalize-sync.ts invalidates it after a finalize ack; transfer-sync.ts is untouched",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "Pure historySections and durationFigure, and the History copy",
    "steps": [
      "features/account/history-sections.ts exports historySections(sessions: AppHistorySession[], today: Date): { title: string; data: AppHistorySession[] }[] — sections in the pages' order, one per device-local calendar day, titled « Aujourd'hui », « Hier », else fr-FR « lundi 28 septembre », with the year when the day is outside today's year",
      "history-sections.test.ts: today and yesterday titles, a same-year day, a previous-year day carries its year, an empty list gives no section, lines of one day share a section",
      "stat-figures.ts exports durationFigure(ms: number): string — 133_000 → « 2 min 13 s », 45_000 → « 45 s », 60_000 → « 1 min », 59_999 → « 59 s »; stat-figures.test.ts covers them",
      "features/account/constants.ts holds HISTORY_SIGNED_OUT « Connecte-toi pour retrouver ton historique. », HISTORY_EMPTY « Aucune partie pour le moment. », HISTORY_ERROR « Impossible de charger ton historique. », the questions unit, the minute and second units",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The « Historique » page lists the History by day, loading the next page on scroll",
    "steps": [
      "apps/mobile/src/app/profile/history.tsx is the page: a SectionList over historySections(every loaded page's sessions, now), stickySectionHeadersEnabled false, no scroll indicator, width capped by MAX_CONTENT_WIDTH, contentContainer paddingTop SPACE.lg, paddingHorizontal GUTTER, paddingBottom tabBarHeight + SPACE.lg",
      "onEndReached fetches the next page only while hasNextPage && !isFetchingNextPage, threshold 0.5; ListFooterComponent is an ActivityIndicator (COLORS.primary) while isFetchingNextPage, nothing otherwise",
      "src/components/account/history-row.tsx renders a line: Theme name, CategoryLabel when category is not null, scoreFigure score, the medal image for COMPETITION, « 10 questions », durationFigure when durationMs is not null; tokens only, no tap",
      "src/components/account/category-label.tsx is the CategoryLabel extracted from theme-stats-table.tsx, which now imports it; src/components/account/history-section-header.tsx renders a section title",
      "Signed out: HISTORY_SIGNED_OUT caption centered and no query; signed in pending: ScreenLoading; failed with no data: ScreenError HISTORY_ERROR with onRetry; success with no line: HISTORY_EMPTY caption",
      "bun run check green"
    ],
    "passes": false
  }
]
```

## Human steps

- After item 1, before the live API runs with the column: `bun run migration:generate` then `bun run migration:run` in `apps/api` — the column lands with its default; no grant or RLS to touch, table-level privileges cover a new column.
- Before item 9's device review: on every dev device, an outbox entry enqueued before item 2 has no `questionCount` and would fail the push — sign out or clear the app storage.
- After item 9: device review of « Historique » signed in and signed out, then the restyle of the line.
