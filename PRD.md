# PRD — Question Explanation

Vocabulary: `apps/admin/CONTEXT.md` (Editor, Catalog, Explanation, Ready To Be Published), `apps/mobile/CONTEXT.md` (Question, Canonical Answer). Rules: `AGENTS.md`, `apps/api/AGENTS.md`, `apps/admin/AGENTS.md`, `docs/agents/conventions.md`, `docs/adr/0005-the-api-reaches-its-data-through-typeorm.md`, `docs/adr/0008-curation-rules-live-in-the-admin-client.md`.

Goal: an Editor can write, edit and clear an Explanation on any Question from the admin Details column.

## Decisions

### Domain

- An Explanation completes a Question's Canonical Answer once it is known — an aside, never a hint toward the answer.
- The Explanation is optional in every staging state: it never gates Ready To Be Published, and a staging write never touches it.
- Absent means `null` in the database. Clearing the textarea and saving is how an Editor deletes it; there is no dedicated delete button.

### Contract (`@mentis/contracts/admin`)

- The Question write schema gains `explanation` as a required, nullable key — the PATCH rewrites the whole Question, so a missing key is a 400, never "leave untouched".
- The value is trimmed; empty or whitespace-only becomes `null`; over 400 characters after trimming is refused.
- The Question response schema gains `explanation: string | null`.
- The app contract is untouched.

### Schema (API)

- `QuestionEntity` gains a nullable `explanation` column of type `text`; the 400 cap lives in the contract only, so it moves without a migration.
- The migration is Hugo's: the item edits the entity and stops there.

### API (`/admin/questions`)

- POST stores the Explanation as the contract shaped it; PATCH `/:id` rewrites it, `null` included; PATCH `/:id/staging` leaves it alone; GET serves it on every Question.
- No new route, no service or repository shape beyond what the entity and contract carry.

### Admin (Details column, Question form)

- A textarea labelled "Explanation" sits directly under "Answers", before "Aliases".
- It opens at 3 rows and resizes vertically only, by the Editor's drag handle.
- A counter `n/400` sits at its bottom right and counts exactly the characters the Editor sees in the textarea — spaces included, nothing trimmed.
- Past 400 the counter turns red and Save is disabled; typing is never blocked.
- After a save the textarea shows the stored text (empty when `null`).
- Editing the Explanation marks the form dirty, like every other field.

### Test seams

- Contract: `packages/contracts/src/admin/question.spec.ts`.
- API: `apps/api/src/curation/_tests/admin-curation.e2e-spec.ts`.
- Admin form state and the over-limit rule as pure functions: `apps/admin/src/features/curation/question-form.test.ts`.

### Out of scope

- Mobile, the app contract, the draw, the Competition — and no test, comment or doc stating the Explanation is not served to players.
- The "Question" textarea, the Details column's scroll, any list indicator or filter for Questions with an Explanation.

## Items

```json
[
  {
    "category": "api",
    "description": "The Explanation travels the whole data path: admin contract, QuestionEntity column, admin form state",
    "steps": [
      "question.spec.ts: the write schema trims the Explanation, turns empty or whitespace-only into null, refuses 401 characters after trimming, refuses a missing key; the response schema requires explanation as a string or null",
      "admin-curation.e2e-spec.ts: POST stores the trimmed Explanation; PATCH /:id with null clears it; PATCH /:id/staging leaves it untouched; GET ?themeId= serves it; a 401-character Explanation answers 400",
      "question-form.test.ts: a blank form and a stored null both open on an empty Explanation; an empty textarea sends null; editing the Explanation marks the form dirty",
      "No migration file added; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "admin",
    "description": "The Explanation textarea with its character counter in the Question form",
    "steps": [
      "The Explanation textarea sits directly under Answers, opens at 3 rows, resizes vertically only",
      "The n/400 counter at its bottom right counts the characters exactly as typed, spaces included",
      "Past 400 characters the counter turns red and Save is disabled; typing is not blocked",
      "After a save the textarea shows the stored text; clearing it and saving stores null",
      "The over-limit rule is a pure function covered in question-form.test.ts; bun run check green"
    ],
    "passes": true
  }
]
```

## Human steps

- After item 1, before any API deploy: `bun run migration:generate` then `migration:run` — the repository selects whole entities, so an API shipped ahead of the column breaks `/admin/questions`. No dashboard SQL: a column on an existing table inherits its grants.
- After item 2: check the form yourself, the Details column's scroll included, and open a ticket if it needs one.
