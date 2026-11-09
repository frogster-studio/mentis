# PRD — The results page explains each Question

Vocabulary: [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) (Explanation, Question, Canonical Answer, Quiz Session, Competition Session, Attempt, Anecdote, Onboarding, Player) and [apps/admin/CONTEXT.md](apps/admin/CONTEXT.md) (Explanation, Editor). Rules: [AGENTS.md](AGENTS.md), [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md), [apps/api/AGENTS.md](apps/api/AGENTS.md), [docs/agents/conventions.md](docs/agents/conventions.md), [ADR 0004](docs/adr/0004-competition-answers-are-judged-server-side.md).

## Decisions

### Scope

- The ⋮ already drawn on every result card opens a bottom sheet holding that Question's Explanation.
- Three screens, and only these: the practice results, the competition results (reopened later in the day included), the Onboarding verdict.
- The Explanation is never shown during play and never in the History.

### Explanation

- An Explanation is a string or `null`. Absent is `null`, never `""`: the app handles no other empty case.
- It may carry `**bold**` and `__italic__` spans, parsed exactly like an Anecdote's text: an orphan marker, or the other marker inside a span, stays literal. No new parsing rule.
- The `⋮` stays on every card whether or not its Question has an Explanation.

### Serving

- Practice: the Explanation arrives with the Question draw, beside the Canonical Answer. The tap reads no network: no skeleton, no error state.
- Competition: the Explanation arrives in each verdict of the transcript and nowhere earlier. The Attempt issuance and the active-Attempt read never carry it: it would reveal the answer.
- The API reads it live off the Question when it builds a transcript, like the Question text and the Canonical Answer: an Editor's later edit shows on the next transcript read.
- The phone persists transcripts, so the persister's buster moves from `api-v2` to `api-v3`.
- No schema change: the column exists.

### Shared emphasis

- The emphasis parser leaves the Anecdote feature for a shared module, renamed out of the Anecdote vocabulary (`emphasisSegments`); the rendering of its segments becomes one shared component.
- The Anecdote and the Explanation both render through that parser and that component. The Anecdote's look does not change.
- Text styles: the existing `TEXT.anecdote` / `anecdoteBold` / `anecdoteItalic` trio, reused as is. No new `TEXT` token.
- `apps/mobile/AGENTS.md`: the Inter Tight Italic line names the Explanation beside the Anecdote.

### The sheet

- The standard `Sheet`: grabber, dismissed by swipe or a tap outside, no button.
- Top to bottom: the title « Explication »; the Question's text and « Réponse : » + its Canonical Answer, in the exact styles the result card gives them; a hairline in `COLORS.stroke` running to the sheet's edges; the Explanation, left-aligned, in `COLORS.ink`.
- No Explanation: same sheet, same title, same recall, and in place of the text « Pas encore d'explication pour cette question. On y travaille, promis ! », centered, in `COLORS.inkMuted`.
- The sheet takes its content's height. An Explanation is at most 400 characters: no inner scroll.

### Interaction

- The `⋮` alone opens the sheet, directly: the card is not pressable, there is no intermediate menu.
- Its accessibility label: « Voir l'explication ».
- One sheet per screen: the card only reports its tap, the screen holds the sheet. Never one sheet per card.

### Onboarding

- The `⋮` stays on the Onboarding verdict's card and opens the same sheet, so the Player learns there that the icon gives more.
- The Onboarding Question carries a hard-coded Explanation: « Perché à **6 893 m** sur la frontière entre le Chili et l'Argentine, c'est aussi le deuxième sommet des Amériques, derrière l'__Aconcagua__. »
- Nothing else points at the `⋮`: no hint line, no coach mark.

### Copy

- French, in the quiz feature's constants: « Explication », « Voir l'explication », « Pas encore d'explication pour cette question. On y travaille, promis ! ». The Onboarding Explanation sits with the Onboarding Question.

### Test seams

- Contracts: the existing specs (`question.spec.ts`, `competition.spec.ts`) assert the drawn Question and the verdict carry `explanation`, string or `null`, and the issued Question does not.
- API: the existing e2e specs through the Nest testing module with fake repositories (`app-content.e2e-spec.ts`, `app-competition.e2e-spec.ts`) assert the served value, `null` included.
- Mobile: the parser's vitest spec moves with the parser, its cases unchanged. No component rendering test (house rule).
- UI items end with `bun run check` green and their screen states listed as steps, reviewed on device by the human.

### Out of scope

- The Explanation during play, in the History, or anywhere but the three screens.
- The back-office: no syntax hint, no preview under the Explanation field.
- Any new `TEXT` token, any button in the sheet, any hint toward the `⋮`.
- A migration or any schema change.

## Items

```json
[
  {
    "category": "api",
    "description": "GET /app/questions serves each drawn Question's Explanation",
    "steps": [
      "Contract: the drawn Question carries explanation, a string or null; its spec covers both",
      "A Question stored with an Explanation is drawn with it as stored; one stored without is drawn with explanation: null",
      "The Onboarding Question carries the hard-coded Explanation « Perché à **6 893 m** sur la frontière entre le Chili et l'Argentine, c'est aussi le deuxième sommet des Amériques, derrière l'__Aconcagua__. »",
      "e2e through the Nest testing module with a fake repository (app-content.e2e-spec.ts)",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "Each verdict of a competition transcript carries its Question's Explanation, and the issuance never does",
    "steps": [
      "Contract: the verdict carries explanation, a string or null; the issued Question schema has no explanation; its spec covers both",
      "POST /app/me/competition/attempts and GET /app/me/competition/attempts/active: no explanation key on any Question",
      "POST /app/me/competition/attempts/:attemptId/finalize: each answer carries the Question's current Explanation, null when it has none; a re-sent finalize hands back the same",
      "The mobile persister's buster is api-v3",
      "e2e through the Nest testing module with fake repositories (app-competition.e2e-spec.ts); bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The emphasis parser and its rendering are shared, and the Anecdote renders through them",
    "steps": [
      "emphasisSegments lives in a shared module outside the Anecdote feature; no anecdote-named parser or segment type is left",
      "One shared component renders a text's segments with TEXT.anecdote / anecdoteBold / anecdoteItalic",
      "The Anecdote card renders through it: **bold**, __italic__, an orphan marker and a nested marker look as before",
      "apps/mobile AGENTS.md: the Inter Tight Italic line names the Explanation beside the Anecdote",
      "The parser's vitest spec moved with it, same cases, passing; bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The ⋮ of each result card opens the « Explication » sheet on the practice results, the competition results and the Onboarding verdict",
    "steps": [
      "A tap on a card's ⋮ opens the standard Sheet titled « Explication »: the Question's text and « Réponse : » + Canonical Answer in the card's styles, a COLORS.stroke hairline to the sheet's edges, then the Explanation left-aligned with its bold and italic spans",
      "A Question with explanation: null: same sheet and recall, « Pas encore d'explication pour cette question. On y travaille, promis ! » centered in COLORS.inkMuted",
      "Practice results show the drawn Question's Explanation, competition results the verdict's, the Onboarding verdict the hard-coded one",
      "Swipe down or a tap outside dismisses; the sheet has no button; opening another card's ⋮ shows that card's Question",
      "The ⋮ carries the accessibility label « Voir l'explication »; the card itself is not pressable; each screen mounts one sheet, not one per card",
      "Copy in the quiz constants; no new TEXT token, no new color; bun run check green"
    ],
    "passes": false
  }
]
```

## Human steps

- Before the loop: nothing — no migration, no dashboard SQL.
- After item 2: deploy the API before testing any mobile build — the phone rejects a draw or a transcript without `explanation`.
- After the last item, on iOS and Android: the sheet on the practice results, the competition results and the Onboarding verdict, with an Explanation (bold and italic spans) and without one; a 400-character Explanation on a small screen. Then merge.
