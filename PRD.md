# PRD — Quick Home Questions on the home

Vocabulary: [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) (Quick Home Question, Question, Theme, Category, Canonical Answer, Square, Player, Streak). Rules: [AGENTS.md](AGENTS.md), [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md), [apps/api/AGENTS.md](apps/api/AGENTS.md), [docs/agents/conventions.md](docs/agents/conventions.md), [ADR 0003](docs/adr/0003-database-admits-only-the-api.md), [ADR 0005](docs/adr/0005-the-api-reaches-its-data-through-typeorm.md).

## Decisions

### Scope

- The feature is the Quick Home Question; French UI label « Questions du jour ».
- Every Player, anonymous included: the read is public, no `/app/me` call.
- Nothing is recorded: no points, no stats, no Practice Streak, no History, no Theme Average, nothing pushed to the API.

### API

- No new route: the phone reads `GET /app/questions?n=3`, `theme` omitted. No "init home" route exists and none is created.
- No new contract type: the existing `appQuestionSchema` gains `category`, the same shape as a Theme's `category` in the Theme list (`id`, `name`, `color`, `secondaryColor`, `icon`). Every served Question carries it, Quiz Session draws included; the competition Question schemas are untouched.
- Without `theme`, the draw serves at most one Question per Theme, Themes and Questions both random; Categories may repeat. An `n` above the count of Published Themes holding a Ready Question returns fewer rows.
- With `theme`, the draw is unchanged. Served Questions stay Ready Questions of Published Themes.
- No schema change: the Category comes from a join, so no migration and no dashboard SQL.

### Choices and judging

- The two choices are the Canonical Answer and one of the three wrong choices drawn uniformly, in uniform random left/right order.
- The pick is a pure function in `@mentis/answer-matching` beside `squareChoices`, rng injected. Reusing `squareChoices` and keeping the first wrong choice is ruled out: it puts the Canonical Answer on the right 3 times in 4.
- The pair is drawn once, when the day's set lands, and stored with it: reopening the app never reshuffles.
- Judging is strict equality with the Canonical Answer; no Answer Matching.
- One tap is the final answer: no confirmation, no Countdown.

### The day's set

- Per device, per Europe/Paris day (`parisDay`, the Streak's clock); two devices of one Account get different sets.
- The set lives in a persisted zustand store on AsyncStorage, the onboarding store's pattern: the day, the `Question[]` as served, each Question's pair, each answered Question's result.
- No request before the store hydrates; a request only when the store holds no set for today.
- An answer is recorded at tap: an app killed mid-animation resumes on the next tile.
- The day is re-read on home focus and on app foreground; a past day's set is dropped, even half-answered, and a new one drawn.
- Every Question of today's set answered: no card and no request until the next Paris day.
- N Questions received: N tiles, N dots, « X sur N »; 0 received: no card.
- Fetch failure: the skeleton holds through the query's retries, then the card is gone, with no error text and no `ScreenError`. The next home focus or foreground retries.

### The card

- It sits on the home, above the Practice card.
- Its tag reads « Questions du jour : X sur N », X the answered Questions. X advances when the answered tile leaves: « 1 sur 3 » while Question 2 is on top.
- The card is a stack of tiles. The top tile is the current Question; each tile beneath is the next Question in its own Category colour, offset downward like a deck's edge; the depth is the remaining count minus one.
- A tile: the Category badge (its icon) and the Theme name above the Question text, two choice buttons side by side, N dots marking the top Question's position.
- A tile wears its Category's colour as is: every Category colour is light enough for ink text.
- No swipe and no manual navigation: the next Question shows only once the one above is answered.

### The choice button

- A new button used by the Quick Home Question card alone; `SquareButton` is not touched.
- Rest: white face, label on two lines at most then an ellipsis, a fixed two-line height so both buttons always match.
- Press feedback: the `PRESSED` dim, no sink.
- Correct tap: only the correct button animates, to a `success` fill with its label in `COLORS.face`, no icon.
- Wrong tap: both animate together. The tapped one turns to a white face, a `danger` border and a cross before its label; the correct one to the `success` fill with its label in `COLORS.face`.
- Both buttons are disabled from the tap until the tile has left, so nothing cuts an animation short.

### Sequence and timing

- Named constants: reveal 250 ms, hold 700 ms, tile exit 350 ms, end message 2 000 ms, skeleton-to-card fade 200 ms.
- Tile exit: the tile slides right off the screen while fading out, then the stack rises one step.
- After the last tile, the end message replaces the card as plain text on the paper for 2 s, then the slot collapses smoothly and the Practice card rises.
- End message: 1 correct → « 1 question juste sur 3, bien joué ! », 2 → « 2 questions justes sur 3, bien joué ! », all correct → « 3 questions justes sur 3, bravo ! »; with fewer than 3 received, « sur » takes N.
- 0 correct: no message (never a « dommage »); the slot collapses right after the last tile.

### Loading

- While the set is not there, a skeleton card keeps the final structure: neutral `COLORS.card`, the tag without its counter, then badge, Theme name, two text lines, two buttons and the dots as skeletons, with the stack already drawn beneath.
- `Skeleton` is a new shared primitive in `components/ui`: an opacity pulse.
- The real card replaces the skeleton with the 200 ms fade.

### Rules and placement

- The mobile rules « never a fourth button look » and « only the sinking controls animate » are deleted from `apps/mobile/AGENTS.md`; animating this card breaks no rule.
- `features/quick-home-question/` holds `api.ts`, `constants.ts` (every string and timing), the store and the pure logic with its tests; `components/quick-home-question/` holds the card, the tile and the button.

### Test seams

- api: the e2e suite through the Nest testing module with a fake repository (`catalog/_tests/app-content.e2e-spec.ts`) for the served shape; a repository spec over a mocked query builder for the one-per-Theme draw (prior art `competition/_tests/competition.repository.spec.ts`).
- contracts: `app/question.spec.ts`.
- answer-matching: `shuffle.spec.ts`, under scripted rng sequences.
- mobile: vitest on pure logic only (rollover, resume, counter, end message, set building), rng and time injected; no component rendering tests. Screen states checked on the iOS simulator dev client; animations reviewed by the human.

### Out of scope

- Points, scoring, stats, Streak, History, Leaderboard, any server-side record of an answer.
- One set shared by every Player; syncing the set across devices.
- Avoiding repeats across days, or with Questions later met in a Quiz Session or an Attempt.
- Swipe navigation, a Countdown, a consolation message.
- Category variety beyond what the one-per-Theme draw gives.

## Items

```json
[
  {
    "category": "api",
    "description": "Every served Question carries its Theme's Category",
    "steps": [
      "`appQuestionSchema` requires `category` in the Theme list's category shape; `app/question.spec.ts` parses a Question with it and rejects one without",
      "e2e through the Nest testing module with a fake repository (`app-content.e2e-spec.ts`): rows of `GET /app/questions` and `GET /app/questions?theme=` each carry their Theme's `category`",
      "Competition specs stay green with their Question schemas unchanged",
      "`bun run check` green"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "A draw without `theme` serves at most one Question per Theme",
    "steps": [
      "Repository spec over a mocked query builder (prior art `competition/_tests/competition.repository.spec.ts`): the theme-less draw keeps one random Ready Question per Published Theme, then orders at random and limits to n",
      "With `theme`, the draw's query is unchanged",
      "e2e: `GET /app/questions?n=3` answers 200 with the repository's rows parsed through the contract",
      "`bun run check` green"
    ],
    "passes": true
  },
  {
    "category": "answer-matching",
    "description": "A pure two-choice pick beside `squareChoices`: the Canonical Answer and one wrong choice, both drawn and ordered at random under an injected rng",
    "steps": [
      "Returns exactly two strings: the Canonical Answer and one of the three wrong choices",
      "Under scripted rng sequences, each of the three wrong choices and both orders are reachable",
      "The input Question is never mutated",
      "Specs in `shuffle.spec.ts`; `bun run check` green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "Pure Quick Home Question day logic: draw or resume per Europe/Paris day, top tile, « X sur N » counter, end message (none at 0)",
    "steps": [
      "No stored set, or a set from a past Paris day even half-answered: a draw is due",
      "Today's set fully answered: no draw and no card",
      "Today's set half-answered: the top tile is the first unanswered Question and the counter reads the answered count over N",
      "N received from 0 to 3 gives N tiles; 0 means no card",
      "Building a set from served Questions stores each Question's pair from the answer-matching pick",
      "End message: 1 → « 1 question juste sur 3, bien joué ! », 2 → « 2 questions justes sur 3, bien joué ! », all correct → « 3 questions justes sur 3, bravo ! », 0 → none; « sur » takes N",
      "vitest in `features/quick-home-question/` with time and rng injected; `bun run check` green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The persisted day set and its fetch: one `GET /app/questions?n=3` per Europe/Paris day, sent after hydration only, none once the day is answered",
    "steps": [
      "`api.ts` reads `GET /app/questions?n=3` with no `theme` and no Authorization header, parsed through `appQuestionDrawResponseSchema`",
      "The store persists to AsyncStorage like the onboarding store and exposes a hydration flag; no request leaves before hydration",
      "On the iOS simulator dev client: the first home visit of a Paris day sends exactly one `GET /app/questions?n=3`; a relaunch the same day sends none",
      "A tap records its result at once; the day is re-read on home focus and on app foreground",
      "`bun run check` green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The Quick Home Question choice button: rest, correct and wrong-tap reveals animated over 250 ms, `PRESSED` dim, fixed two-line height",
    "steps": [
      "Rest: white face, label on two lines at most then an ellipsis, both buttons at the fixed two-line height",
      "Press: the `PRESSED` dim, no sink",
      "Correct tap: the correct button alone ends on a `success` fill with a `COLORS.face` label, no icon",
      "Wrong tap: both animate together; the tapped one ends on a white face, `danger` border and a cross before its label, the correct one on the `success` fill with a `COLORS.face` label",
      "Disabled from the tap until the tile has left; `SquareButton` untouched",
      "End states screenshotted on the iOS simulator dev client; `bun run check` green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The Quick Home Question card above the Practice card: tag, tile stack in Category colours, badge and Theme name, dots, `Skeleton` while loading, gone on failure",
    "steps": [
      "Home shows the card above the Practice card, its tag reading « Questions du jour : 0 sur 3 »",
      "Top tile in its Category's colour: Category badge and Theme name above the text, two choice buttons, N dots with the top Question's dot active",
      "Tiles beneath wear their own Question's Category colour, offset like a deck's edge, depth equal to the remaining count minus one",
      "No swipe gesture moves between Questions",
      "Loading: a skeleton card in the final structure on `COLORS.card`, tag without counter, the `components/ui` `Skeleton` pulsing; a 200 ms fade to the real card",
      "Failure after the query's retries: no card and no error text; day fully answered: no card",
      "States screenshotted on the iOS simulator dev client; `bun run check` green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The answer sequence: reveal, hold, tile exits right while fading, stack rises, end message for 2 s, slot collapses",
    "steps": [
      "Tap → reveal 250 ms → hold 700 ms → the tile slides right off the screen while fading over 350 ms → the stack rises one step and the counter advances",
      "After the last tile: the end message replaces the card on the paper for 2 000 ms, then the slot collapses and the Practice card rises; 0 correct: the collapse follows the last tile directly",
      "Every timing is a named constant in `features/quick-home-question/constants.ts`",
      "A relaunch mid-sequence resumes on the next tile",
      "End states screenshotted on the iOS simulator dev client; `bun run check` green"
    ],
    "passes": false
  }
]
```

## Human steps

- Before the loop: the `apps/mobile/CONTEXT.md` (Quick Home Question) and `apps/mobile/AGENTS.md` (two rules deleted) edits ride on the loop's branch, so they land in its PR.
- After item 2: on the dev API against the hosted database, `GET /app/questions?n=3` answers 3 distinct Themes, each with its Category — the SQL is only proven against a mocked query builder.
- After item 8: a device review of the animations on iOS and Android (reveal, tile exit, collapse, skeleton pulse) — the Browser pane cannot run them.
