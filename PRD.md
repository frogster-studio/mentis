# PRD — Catalog search in the curation dashboard

Vocabulary: [apps/admin/CONTEXT.md](apps/admin/CONTEXT.md) (Editor, Catalog, Category, Theme, Question, Ready To Be Published, Published), [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) (Canonical Answer, Alias, Misspelling, Square). Rules: [AGENTS.md](AGENTS.md), [apps/admin/AGENTS.md](apps/admin/AGENTS.md), [apps/admin/docs/ui-conventions.md](apps/admin/docs/ui-conventions.md), [apps/api/AGENTS.md](apps/api/AGENTS.md), [docs/agents/conventions.md](docs/agents/conventions.md), [ADR 0003](docs/adr/0003-database-admits-only-the-api.md), [ADR 0005](docs/adr/0005-the-api-reaches-its-data-through-typeorm.md), [ADR 0008](docs/adr/0008-curation-rules-live-in-the-admin-client.md).

## Decisions

### Corpus and API

- The search runs in the admin client: Categories and Themes are already loaded, the Questions corpus is fetched once at dashboard mount. No API search route, no DB index or extension, no debounce.
- Scale ceiling: 1,000 Questions, 200 Themes, 50 Categories.
- `adminQuestionListQuerySchema.themeId` becomes optional. Absent, `GET /admin/questions` lists every Question, `createdAt` desc then `id` desc like the per-Theme read; present, unchanged.
- The corpus query sits under the `["curation","questions"]` key prefix, so the existing `refetchCatalogColumns` refetches it after a Question create, edit or delete. A Ready flip refetches nothing: no searched text changes. `staleTime: Infinity` already rules out refocus refetches.

### Matching

- One fold for the query and the searched text: lowercase, accents removed (NFD), `œ→oe`, `æ→ae`. Every character that is not `a-z` or `0-9` after folding splits words: `l'Everest` → `l`, `everest`; `Saint-Exupéry` → `saint`, `exupery`.
- A query holding no word (`?`, blanks) searches nothing.
- A query word finds an item word when it starts it, or when both are equal once a final `s` is dropped from each: `che` finds Chevalier, `hommes` finds homme, `quels` finds Quel, `detrui` finds détruisent; `détruire` does not find détruisent, `bus` does not find bureau.
- A whole-word find is the second case, or a start that covers the entire item word.
- Every query word must find a word in the item (AND), each matched independently.
- The fold is the admin's own; answer-matching's `normalize` is not reused (it strips leading articles and is not exported).

### Searched fields

- Category: its name. Theme: its name. Question: the union of its text, Canonical Answer and three wrong choices, so query words may land in different fields (`chevalier bayard`).
- The union never crosses entities: `histoire napoleon` finds no Theme Napoléon in Category Histoire.
- Never searched: Aliases, Misspellings, Explanation, a Theme's Category name, a Question's Theme name.
- Staging is ignored: unready Questions and unpublished Themes are found.

### Ranking

- Three groups in fixed order, Categories → Themes → Questions, each labelled with its uncapped total (`Questions · 42`).
- Within a group: more query words found whole first; then, for Questions, the best field holding a find, Canonical Answer before text before wrong choices; then the shorter name or text; then alphabetical.
- Caps: 3 Categories, 5 Themes, 8 Questions.

### The Search bar

- It sits in the header's center slot; the dashboard owns it, since it holds the selection and the unsaved-changes guard, and the header only lends the slot.
- Results drop down over the columns without shifting them. Placeholder: `Search the Catalog`.
- Results start at the first letter or digit, no minimum length. No word: the list stays closed. No find: `No results.`. Corpus pending: Categories and Themes answer, the Questions group shows `Loading…`.
- Rows: a Category shows its badge (color + icon) and name; a Theme its name, its Category's name and the Published badge; a Question its truncated text, its Canonical Answer, every wrong choice holding a find, and its Theme's name.
- Found words are highlighted whole, in their original spelling, `text-sky-700 font-medium`; fields that are not searched are never highlighted.
- ARIA `combobox` / `listbox` / `option`.

### Selecting a result

- Category → `{ categoryId }`; Theme → `{ categoryId: its Category, themeId }`; Question → `{ categoryId, themeId, questionId }`. The columns follow; Details shows the selected item.
- The same unsaved-changes confirm as a row click. Cancelled: nothing moves, the list stays open. Accepted or clean: authoring closes, a history entry is pushed, Back returns to the previous selection.
- The list closes and the query stays; refocusing reopens the same results.
- The selected row scrolls into view in its column once rendered (a Question after its Theme's Questions load), only after a search selection, never on a deep link or Back.

### Keyboard

- ⌘K on Mac, Ctrl+K elsewhere, and `/` outside a text field focus the bar.
- ↑/↓ move the active option across groups, hover moves it too; Enter selects it exactly like a click.
- Escape closes the list; a second Escape empties the bar.

### Docs

- The admin UI conventions gain one line: the header's center slot holds the Catalog search. No ADR, no glossary term.

### Test seams

- Contract: the admin question contract spec.
- API: the curation e2e spec through the Nest testing module with `fakeCurationRepository` (prior art: `admin-curation.e2e-spec.ts`, which already reads `/admin/questions?themeId=`).
- Pure functions: vitest specs beside them, the examples above verbatim (prior art: `selection.test.ts`).
- UI: happy-dom component specs driving the combobox by role, the API client mocked (prior art: `category-form.test.tsx`).

### Out of scope

- Stemming (`détruire` finding détruisent), `x` and irregular plurals, stopwords, typo tolerance, matches inside a word.
- An API search route, any DB index or extension.
- Searching Aliases, Misspellings or Explanations; highlighting only the typed prefix.
- Shortcuts beyond those listed; scroll-into-view outside a search selection.

## Items

```json
[
  {
    "category": "api",
    "description": "GET /admin/questions lists every Question, newest first, when themeId is absent",
    "steps": [
      "Contract spec: the list query parses {} and { themeId: <guid> }, rejects { themeId: \"x\" }",
      "No themeId: 200 with every Question across Themes; the repository read orders createdAt desc then id desc like the per-Theme read",
      "With themeId: unchanged, that Theme's Questions only",
      "Unauthenticated: 401; non-Editor: 403",
      "e2e through the Nest testing module with fakeCurationRepository"
    ],
    "passes": true
  },
  {
    "category": "admin",
    "description": "A Search word finds a Catalog word by its start or by equality without the final s, accent-blind",
    "steps": [
      "\"che\", \"francais\", \"quel\" and \"chevalier francais\" find « Quel chevalier français était surnommé « sans peur et sans reproche » ? »",
      "\"homme fr\" and \"francais detrui\" find « Quels sont les Hommes Francais qui détruisent… »; \"francais détruire\" does not",
      "\"hommes\" finds homme, \"quels\" finds Quel, \"coeur\" finds cœur, \"everest\" finds l'Everest, \"exu\" finds Saint-Exupéry; \"bus\" does not find bureau, \"saintex\" does not find Saint-Exupéry",
      "\"?\" and blanks yield no query word",
      "Every find carries its word's span in the original text, accents kept, and whether it is whole",
      "vitest pure spec"
    ],
    "passes": true
  },
  {
    "category": "admin",
    "description": "searchCatalog answers the ranked, capped Categories, Themes and Questions groups with their uncapped totals",
    "steps": [
      "\"chevalier bayard\" finds a Question whose text holds chevalier and whose Canonical Answer is Bayard; \"histoire napoleon\" finds no Theme Napoléon in Category Histoire",
      "A word present only in an Alias, a Misspelling or an Explanation finds nothing",
      "Order: more whole-word finds first; for Questions, Canonical Answer before text before wrong choices; then shorter; then alphabetical",
      "Caps 3 Categories, 5 Themes, 8 Questions, each group carrying its uncapped total",
      "Unready Questions and unpublished Themes are found",
      "A Question result lists the wrong choices holding a find, every shown field with its highlight spans",
      "vitest pure spec"
    ],
    "passes": true
  },
  {
    "category": "admin",
    "description": "The header's center slot holds the Search bar, which lists the grouped results as the Editor types",
    "steps": [
      "The dashboard fetches the Questions corpus once at mount (GET /admin/questions, no themeId) under the [\"curation\",\"questions\"] prefix; a Question save refetches it, a Ready flip does not",
      "\"?\" or blanks: no list; no find: \"No results.\"; corpus pending: Categories and Themes listed, the Questions group shows \"Loading…\"",
      "Rows: Category badge + name; Theme name + Category name + Published badge; Question truncated text + Canonical Answer + found wrong choices + Theme name; group labels carry totals",
      "Found words render whole in text-sky-700 font-medium; non-searched fields carry none",
      "Placeholder \"Search the Catalog\"; ARIA combobox, listbox, option",
      "The admin UI conventions carry the header center-slot line",
      "happy-dom component spec driving the combobox by role, API client mocked"
    ],
    "passes": true
  },
  {
    "category": "admin",
    "description": "Selecting a result selects it in the columns and in Details",
    "steps": [
      "Category → { categoryId }; Theme → { its categoryId, themeId }; Question → { categoryId, themeId, questionId }; Details shows the selected item",
      "Dirty form: the unsaved-changes confirm runs; cancelled, nothing moves and the list stays open",
      "Accepted or clean: authoring closes, a history entry is pushed, Back returns to the previous selection",
      "The list closes, the query stays, refocus reopens the same results",
      "The selected row scrolls into view once its column renders; a deep link or Back scrolls nothing",
      "happy-dom component spec"
    ],
    "passes": true
  },
  {
    "category": "admin",
    "description": "The keyboard drives the Search",
    "steps": [
      "⌘K (Ctrl+K off Mac) and / outside a text field focus the bar; / typed inside a text field stays a character",
      "↑/↓ move the active option across groups, hover moves it too; Enter selects it exactly like a click",
      "Escape closes the list; a second Escape empties the bar",
      "happy-dom component spec"
    ],
    "passes": true
  }
]
```

## Human steps

- Before the loop: commit or stash the in-progress resizable-columns work, or the first item's commit sweeps it in.
- After the last item: review the bar in a browser on the real Catalog (ranking feel, highlight), then merge. The API deploy must land before the admin's corpus call works: a list without `themeId` is a 400 on the old API.
- No migration, no dashboard SQL.
