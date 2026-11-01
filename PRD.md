# PRD — Anecdotes on the home

Vocabulary: [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) (Anecdote, Player, Question, Theme, Category, Streak, History). Rules: [AGENTS.md](AGENTS.md), [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md), [apps/api/AGENTS.md](apps/api/AGENTS.md), [docs/agents/conventions.md](docs/agents/conventions.md), [ADR 0003](docs/adr/0003-database-admits-only-the-api.md), [ADR 0005](docs/adr/0005-the-api-reaches-its-data-through-typeorm.md).

## Decisions

### Scope

- The Anecdote replaces the Quick Home Question on the home; French UI label « Anecdotes du jour ». The Player is no longer asked anything.
- « Quick Home Question » leaves the code wherever it stands: folders, components, store key, query keys, constants, styles.
- Three Anecdotes a day, for every Player, anonymous included: the read is public, no `/app/me` call.
- An Anecdote belongs to no Question, Theme or Category.
- Nothing is recorded: no points, no stats, no Streak, no History, nothing pushed to the API when an Anecdote is read or dismissed.

### The table

- A dedicated `anecdotes` table: `AnecdoteEntity`, the shape of `theme.entity.ts`, with a uuid `id`, `text` as a `varchar` of length 140, `created_at` and `updated_at`.
- 140 is the hard cap: an over-long insert fails at the database. The `**` and `__` markers count in the 140.
- No staging flag: every row is servable.
- Rows are inserted by SQL on the dashboard; no back-office screen.

### API

- `GET /app/anecdotes?n=` lives in the `catalog` feature, with its own controller, service and repository in the layer folders; no new feature folder.
- Public: no auth guard, `DrawThrottlerGuard` like `GET /app/questions`, because it is also a random draw.
- `n` is an integer from 1 to 50, 3 by default; anything else answers 400.
- It answers `[{ id, text }]`: `n` distinct rows at random, fewer when the table holds fewer, `[]` when it is empty.
- The schemas live in `@mentis/contracts/app`.
- The phone sends `n=3` explicitly, from the constant the skeleton also uses.

### The day's set

- Per device, per Europe/Paris day (`parisDay`, the Streak's clock); two devices of one Account get different sets.
- The set lives in a persisted zustand store on AsyncStorage, the onboarding store's pattern: the day, the Anecdotes as served, how many are dismissed.
- No request before the store hydrates; a request only when the store holds no set for today.
- A dismissal is recorded at tap: an app killed mid-animation resumes on the next Anecdote.
- The day is re-read on home focus and on app foreground; a past day's set is dropped, even partly dismissed, and a new one drawn.
- Every Anecdote of today's set dismissed: no card and no request until the next Paris day.
- N Anecdotes received: N cards, N dots. 0 received: no card, and that empty set holds until the next Paris day.
- Fetch failure: the skeleton holds through the query's retries, then the card is gone, with no error text and no `ScreenError`. The next home focus or foreground retries.

### Text format

- The stored text carries two markers only: `**…**` for bold and `__…__` for italic. The formatting happens on the phone, in a pure function.
- Spans do not nest: inside one span, the other marker shows literally.
- An orphan marker shows literally.
- Line breaks in the text are kept.

### Faces and text styles

- Inter Tight Italic joins the faces, for `__…__` and the footer label. No SemiBold Italic: spans do not nest.
- The mobile rule « Three faces, never more » is rewritten to name the faces in use: Epunda Slab Regular, Epunda Slab Medium, Inter Tight SemiBold, Inter Tight Regular, Inter Tight Italic.
- Four new `TEXT` styles: `anecdote` (Regular 14/20), `anecdoteBold` (SemiBold 14/20), `anecdoteItalic` (Italic 14/20), `anecdoteLabel` (Italic 10).

### The card

- It sits on the home, above the Practice card.
- Top to bottom: the text on the left with the cross at the top right; a 1 px `COLORS.stroke` separator; a footer with « ANECDOTES DU JOUR » on the left and the dots on the right.
- The text is `COLORS.ink`. The label, in capitals, and the cross are `COLORS.inkMuted`.
- There is no badge above the card and no « X sur N » counter.
- The text zone has a minimum height of 4 lines, so every card has the same height: a shorter text leaves blank space above the separator.
- The text is never cut: on a screen narrower than 360 pt or with an enlarged system text size, the card grows.
- The cross is the MaterialIcons `close` glyph in a bare `Pressable` dimmed with `PRESSED`, accessibility label « Passer l'anecdote ».
- The dots keep their look: N dots, the top Anecdote's active in ink, the others in ink with the `33` alpha.
- No swipe. Tapping the card body or the dots does nothing.

### The pile

- Colours belong to the position, not to the Anecdote: the top card is `COLORS.face` (#FFFFFF), the one beneath `COLORS.trough` (#E6D3C3), the deepest a new role `COLORS.troughDeep` (#D7BBA1).
- The depth is the remaining count minus one: 3 remaining show all three colours, 2 show the top two, 1 shows the top card alone.
- Solid `backgroundColor`, no `gradient()` and no stroke border: position colours never merge two neighbours.

### Sequence and timing

- Named constants: card exit 350 ms, slot collapse 250 ms, skeleton-to-card fade 200 ms.
- Cross tap: the top card peels off the pile to the left, tilting while it fades out, with no reveal and no hold before it. The animation is the existing peel; only the content and the colour change.
- The footer belongs to the card and leaves with it. The next card, already in place beneath in `COLORS.face`, carries the label at the same spot; only the dots differ.
- The cross is inert until the exit has ended: two quick taps remove one card.
- The Practice card does not move on a cross tap, every card having the same height.
- After the last cross: the card peels off, then the slot collapses and the Practice card rises. No end message.

### Loading

- While the set is not there, a skeleton keeps the final structure on the pile's position colours: three `Skeleton` bars in the 4-line text zone, no cross, the footer drawn for real (separator, label, 3 dots with the first active).
- The real card replaces the skeleton with the 200 ms fade.

### What goes away, what stays

- Everything only the Quick Home Question used goes, so the branch's final diff against `main` carries none of it: `category` on a served Question, the theme-less one-per-Theme draw, `quickHomeQuestionChoices`, the choice button, the tile, the tile skeleton, the Question-based day set, the end message.
- `GET /app/questions` behaves as it does on `main`.
- `Skeleton`, the stack, the sheet, the peeling sheet, the dots, the store pattern and the focus and foreground re-read stay, renamed where they carry the old name.
- The dev-only reset link stays, renamed for the Anecdote.
- `TEXT.label` gets its `lineHeight: 20` back; `theme/text.ts` differs from `main` by the Anecdote styles alone.
- In `apps/mobile/AGENTS.md`, « never a fourth button look » and its example come back; « only the sinking controls animate » stays deleted, because the peel and the collapse animate.

### Test seams

- api: the e2e suite through the Nest testing module with a fake repository, in a new `catalog/_tests/app-anecdotes.e2e-spec.ts` (prior art `app-content.e2e-spec.ts`); a repository spec over a mocked query builder, in a new `catalog/_tests/anecdote.repository.spec.ts` (prior art `competition/_tests/competition.repository.spec.ts`).
- contracts: a new `app/anecdote.spec.ts` (prior art `app/question.spec.ts`).
- mobile: vitest on pure logic only (text segments, rollover, resume, top Anecdote, dismissal, pile colours), time injected; no component rendering tests.
- Screen states and animations are reviewed by the human on devices, never by the loop.

### Out of scope

- A back-office screen for Anecdotes, and any staging state.
- One set shared by every Player; syncing the set across devices.
- Avoiding repeats across days.
- Swipe navigation, tappable dots, a counter, an end message.
- Bold italic and any marker beyond `**` and `__`.
- Truncating a text with an ellipsis.
- Any server-side record of a dismissal.

## Items

```json
[
  {
    "category": "api",
    "description": "The `anecdotes` table as an entity: uuid `id`, `text` capped at 140 characters, timestamps",
    "steps": [
      "`_database/entities/anecdote.entity.ts` copies the shape of `theme.entity.ts`: `@Entity(\"anecdotes\")`, extends `BaseEntity`, generated uuid key",
      "`text` is a `varchar` of length 140; `created_at` and `updated_at` are `timestamptz` date columns",
      "No file under `_database/migrations/` is added or changed",
      "`bun run check` green"
    ],
    "passes": true
  },
  {
    "category": "contracts",
    "description": "The schemas of `GET /app/anecdotes`: `n` from 1 to 50, 3 by default, answering `[{ id, text }]`",
    "steps": [
      "`appAnecdoteDrawQuerySchema`: no `n` parses to 3; `\"1\"` and `\"50\"` coerce to numbers; `\"0\"`, `\"51\"` and `\"2.5\"` are rejected",
      "`appAnecdoteDrawResponseSchema` parses `[{ id, text }]`, strips any other column, rejects a row without `text`",
      "Both are exported from `@mentis/contracts/app`",
      "Specs in `app/anecdote.spec.ts`; `bun run check` green"
    ],
    "passes": false
  },
  {
    "category": "api",
    "description": "`GET /app/anecdotes` draws n distinct Anecdotes at random, public, on the Draw tier",
    "steps": [
      "e2e through the Nest testing module with a fake repository (`catalog/_tests/app-anecdotes.e2e-spec.ts`): no Authorization and no `n` answers 200, the repository is asked for 3, and `createdAt` is absent from the body",
      "`?n=50` answers 200; `?n=0` and `?n=51` answer 400 in the `ErrorResponse` envelope",
      "An empty table answers 200 `[]`; fewer rows than `n` answers those rows",
      "Past the Draw tier's 30 requests a minute from one IP, the route answers 429",
      "Repository spec over a mocked query builder (`catalog/_tests/anecdote.repository.spec.ts`, prior art `competition/_tests/competition.repository.spec.ts`): the draw orders by `random()` and limits to n",
      "The `catalog/` line of `apps/api/AGENTS.md` names `/app/anecdotes`",
      "`bun run check` green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "Pure Anecdote text formatting: `**…**` and `__…__` split into regular, bold and italic segments",
    "steps": [
      "A text with both markers gives regular, bold and italic segments in order, markers removed",
      "A text with no marker gives one regular segment",
      "An orphan `**` or `__` shows literally",
      "Inside `**…**` a `__` shows literally, and the reverse",
      "Line breaks stay in their segment",
      "vitest in `features/anecdote/`; `bun run check` green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "Pure Anecdote day logic: draw due per Europe/Paris day, top Anecdote, dismissal, pile colours, with the `COLORS.troughDeep` role",
    "steps": [
      "No stored set, or a set from a past Paris day even partly dismissed: a draw is due",
      "Today's set, even empty or fully dismissed: no draw is due",
      "A partly dismissed set: the top Anecdote is the first not dismissed and its position is the dismissed count",
      "Dismissing moves to the next Anecdote without mutating the set, and does nothing once all are dismissed",
      "`COLORS.troughDeep` is `#D7BBA1`; pile colours are `face`, `trough`, `troughDeep` for 3 remaining, `face`, `trough` for 2, `face` for 1",
      "vitest in `features/anecdote/` with time injected; `bun run check` green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The Anecdote replaces the Quick Home Question on the home: persisted day set, one `GET /app/anecdotes?n=3` per Paris day, a minimal card, every Quick Home Question mobile file gone",
    "steps": [
      "`features/anecdote/api.ts` reads `GET /app/anecdotes` with `n=3` and no Authorization header, parsed through `appAnecdoteDrawResponseSchema`",
      "The store persists on AsyncStorage as `mentis-anecdote` and exposes a hydration flag; no request leaves before hydration, and none while today's set is stored",
      "The day is re-read on home focus and on app foreground, and a failed draw is retried there",
      "Home shows the card above the Practice card: the top Anecdote's text and a cross; a tap records the dismissal at once and shows the next Anecdote, with no animation yet",
      "The dev-only reset link drops today's set under its Anecdote name",
      "`features/quick-home-question/` and `components/quick-home-question/` no longer exist, and no `apps/mobile/src` file names a Quick Home Question",
      "`git diff main...HEAD` is empty for `apps/mobile/src/components/category-badge.tsx`; `theme/text.ts` has no Quick Home Question style and `TEXT.label` has its `lineHeight: 20` back",
      "`apps/mobile/AGENTS.md` carries « never a fourth button look » and its example again; « only the sinking controls animate » stays deleted",
      "`bun run check` green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The Anecdote card's anatomy: formatted text and cross, separator, footer, and a solid pile in position colours",
    "steps": [
      "`InterTight-Italic.ttf` loads in `app/_layout.tsx`; `TEXT` gains `anecdote` (Regular 14/20), `anecdoteBold` (SemiBold 14/20), `anecdoteItalic` (Italic 14/20) and `anecdoteLabel` (Italic 10)",
      "The fonts rule of `apps/mobile/AGENTS.md` names the five faces in use instead of « Three faces, never more »",
      "The text renders through the pure segments in those styles, `COLORS.ink`, with a minimum height of 4 × `TEXT.anecdote.lineHeight` and no `numberOfLines`",
      "The cross is MaterialIcons `close` in a bare `Pressable` with `PRESSED`, `COLORS.inkMuted`, accessibility label « Passer l'anecdote »",
      "A 1 px `COLORS.stroke` separator; beneath it « ANECDOTES DU JOUR » in `TEXT.anecdoteLabel` and `COLORS.inkMuted` on the left, N dots on the right with the top Anecdote's active",
      "The pile wears the pure pile colours as plain `backgroundColor`, with no `gradient()` call and no stroke border",
      "Every string is in `features/anecdote/constants.ts`; `bun run check` green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The cross's sequence: the top card peels off left over the next one already in place, the cross inert meanwhile, the slot collapsing after the last card",
    "steps": [
      "Tap: the dismissal is recorded at once, then the existing peel runs (left, tilting, fading, 350 ms) with no reveal and no hold, the footer leaving with the card",
      "The next Anecdote is already in place beneath, in `COLORS.face`",
      "The cross is inert until the peel has ended: two quick taps dismiss one Anecdote",
      "After the last cross: the peel ends, then the slot collapses over 250 ms and the Practice card rises, with no end message",
      "A relaunch mid-peel resumes on the next Anecdote; a relaunch on a fully dismissed day shows no card and no collapse",
      "Timings are named constants in `features/anecdote/constants.ts`; `bun run check` green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The Anecdote card's loading state: a skeleton in the final structure, then a 200 ms fade",
    "steps": [
      "While the set is pending: the pile in its 3 position colours, three `Skeleton` bars in the 4-line text zone, no cross",
      "The footer is drawn for real: separator, label, 3 dots with the first active",
      "The real card replaces the skeleton with the 200 ms fade",
      "Failure after the query's retries: no card and no error text; 0 received: no card; a fully dismissed day: no card",
      "`bun run check` green"
    ],
    "passes": false
  },
  {
    "category": "cleanup",
    "description": "What only the Quick Home Question needed leaves the API, the contracts and answer-matching: `category` on a served Question, the one-per-Theme draw, `quickHomeQuestionChoices`",
    "steps": [
      "`git diff main...HEAD` is empty for `apps/api/src/catalog/repositories/catalog.repository.ts`, `apps/api/src/catalog/_tests/app-content.e2e-spec.ts` and `apps/api/src/competition/_tests/app-competition.e2e-spec.ts`",
      "`git diff main...HEAD` is empty for `packages/contracts/src/app/question.ts`, `packages/contracts/src/app/question.spec.ts`, `packages/answer-matching/src/shuffle.ts` and `packages/answer-matching/src/shuffle.spec.ts`",
      "`git diff main...HEAD` is empty for `apps/mobile/src/features/onboarding/constants.ts` and `apps/mobile/src/features/quiz/session-reducer.test.ts`",
      "`apps/api/src/catalog/_tests/catalog.repository.spec.ts` no longer exists",
      "No tracked file outside `PRD.md` and `progress.txt` names a Quick Home Question",
      "`bun run check` green"
    ],
    "passes": false
  }
]
```

## Human steps

- After item 1: run `bun run migration:generate` then `bun run migration:run`, then apply the [ADR 0003](docs/adr/0003-database-admits-only-the-api.md) lock to the new table on the Supabase dashboard.
- After item 1: insert the Anecdotes by SQL, before the app's first launch against them: an empty draw holds until the next Paris day, unless the dev link resets it.
- After item 3: on the dev API against the hosted database, `GET /app/anecdotes` answers 3 distinct rows and `?n=51` answers 400 — the SQL is only proven against a mocked query builder.
- After item 9: a device review on iOS and Android, on a 360 pt screen too: the card, the 4-line height, the formatted text, the peel, the collapse, the skeleton — the loop cannot run them.
