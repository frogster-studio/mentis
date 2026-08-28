# Catalog curation dashboard

## Problem Statement

The Catalog (Categories, Themes, Questions) can only be authored through the Supabase SQL editor and dashboard today. As the sole Editor, Hugo has no way to create, edit, stage or take down quiz content from a product surface — and no safety net between "row exists" and "players are served it". Every content fix is raw SQL against production, and nothing distinguishes finished content from work in progress.

## Solution

One desktop-only dashboard page in the admin app: four Miller columns — Categories → Themes of the selected Category → Questions of the selected Theme → an editor pane for whatever is selected (or the Question being created). It gives full CRUD over the Catalog through the API, plus a staging model: a Question is marked **Ready To Be Published**, a Theme is switched **Published** behind a hard-switch consequence modal, and a Category is **Visible** by derivation. Players are only ever served Ready Questions inside Published Themes; everything else does not exist app-side.

## User Stories

### Dashboard shell

1. As an Editor, I want a single dashboard page managing the whole Catalog, so that curation never sends me to the SQL editor.
2. As an Editor, I want four columns (Categories, Themes of the selected Category, Questions of the selected Theme, editor pane), so that I navigate the hierarchy without leaving the page.
3. As an Editor, I want the editor pane to show the selected Category, Theme or Question — or the Question being created — so that reading and editing happen in one place.
4. As an Editor, I want my selection encoded in the URL, so that a refresh or a shared link restores the exact spot.
5. As an Editor, I want every column ordered by creation date, newest first, so that recent work is always on top.
6. As an Editor, I want each Theme row to show its Ready/total Question counts, so that I see publishability at a glance.
7. As an Editor, I want each Category to carry a derived Visible badge, so that I know what players can currently see without doing math.
8. As an Editor, I want Categories and Themes loaded eagerly and Questions loaded per Theme on first selection, so that the page feels instant at any catalog size.
9. As an Editor, I want toggles to apply optimistically with rollback on failure, so that curation never waits on a spinner.
10. As an Editor, I want the dashboard in English, so that it matches the rest of the admin app while French stays the players' voice.

### Categories

11. As an Editor, I want to create a Category with a name, a color and an icon, so that new Catalog areas start life in the dashboard.
12. As an Editor, I want the icon field to autocomplete against the real MaterialIcons glyph list with a preview, so that a typo'd icon can never be saved.
13. As an Editor, I want a color input constrained to lowercase `#rrggbb`, so that stored colors always match what the app expects.
14. As an Editor, I want to edit a Category's name, color and icon, so that presentation fixes are immediate.
15. As an Editor, I want Category deletion available only when it holds no Themes (disabled with a hint otherwise), so that I cannot orphan content.
16. As an Editor, I want slugs auto-generated from the name at creation, immutable and invisible, so that I never think about them.

### Themes

17. As an Editor, I want to create a Theme under the selected Category, so that context flows from where I am.
18. As an Editor, I want to upload a Theme image from my machine and have the browser validate, resize and encode it before it lands in storage, so that every stored image is uniform without server work.
19. As an Editor, I want to edit a Theme's name, image and Category, so that every part of it stays correctable.
20. As an Editor, I want the Published switch disabled (with the reason shown) until the Theme holds at least 20 Ready Questions, so that a thin Theme cannot go live.
21. As an Editor, I want publishing AND unpublishing a Theme to open a consequence modal with live counts, so that the hard switch is never flipped blind.
22. As an Editor, I want the unpublish modal to warn when this is the Category's last Published Theme, so that I know the Category itself goes dark.
23. As an Editor, I want Theme deletion available only while unpublished, confirmed by a modal stating how many Questions die with it, so that a live Theme can never vanish by accident.

### Questions

24. As an Editor, I want a « create new question » button on the dashboard that opens a blank Question in the editor pane with the current Theme preselected, so that authoring starts in one click.
25. As an Editor, I want the Question form to present four answer slots with a radio designating the correct one, so that authoring reads like the game plays.
26. As an Editor, I want saving a Question refused — client-side and API-side — unless text and four answers with one designated correct are present, so that an incomplete Question can never exist as a row.
27. As an Editor, I want aliases entered in a single input where commas split into chips, so that a batch of variants takes seconds.
28. As an Editor, I want misspellings entered the same chip way, so that both lists behave identically.
29. As an Editor, I want aliases and misspellings stored lowercase whatever I type, so that Answer Matching sees a normalized list.
30. As an Editor, I want the Ready To Be Published flag to flip instantly with no modal, so that staging twenty Questions is twenty clicks, not forty.
31. As an Editor, I want a blocking popup — not a confirm — when un-readying would drop a Published Theme below 20 Ready Questions, telling me to unpublish the Theme first, so that the floor is unbreakable from this page.
32. As an Editor, I want the same floor guard on deleting a Ready Question under a Published Theme, so that deletion cannot sneak past what the toggle blocks.
33. As an Editor, I want to edit a Ready Question under a Published Theme directly, so that a wrong answer reported by players is fixed live without unpublishing anything.

### Access

34. As an Editor, I want the admin API surface to refuse anonymous callers (401) and authenticated non-Editors (403), so that a player token can never curate.
35. As an Editor, I want the browser to reach the API only through the admin server forwarding my token, so that no cross-service secret and no direct Railway exposure exists.

### Players (serving effects)

36. As a Player, I want to see only Published Themes and Visible Categories, so that half-finished content never reaches my screen.
37. As a Player, I want Theme question counts and Draws to involve only Ready Questions, so that a session always plays finished content.
38. As a Player, I want serving untouched by curation policy (no threshold recomputation), so that play stays as fast as before the dashboard existed.

## Implementation Decisions

### Domain model (Catalog curation context)

- Three staging states, named per the curation glossary: **Ready To Be Published** (stored flag on Question), **Published** (stored flag on Theme), **Visible** (derived Category state = has ≥1 Published Theme; never stored, never toggled).
- Both stored flags default to false. **No backfill**: the entire existing catalog starts dark and is re-lit from the dashboard.
- Serving is blind to curation policy: the public read predicate is exactly `theme is Published AND question is Ready To Be Published`. Categories need no predicate — filtering Themes filters them for free. Served question counts count Ready Questions only.
- Curation policy (the 20-Ready unlock, the floor of 20, delete guards) is **admin-client-side only** — the admin API accepts any flag write from an Editor and never recomputes counts (ADR 0008). Data-shape integrity (Question completeness) is validated on both sides.
- Republishing restores exactly the prior staged state: ancestor toggles never rewrite descendant flags (computed visibility, not stored cascade).

### API

- A new curation feature (standard layered folders) publishing `/admin/categories`, `/admin/themes`, `/admin/questions` CRUD plus signed-upload-URL minting for Theme images, all behind the editor-claim guard, throttled on a `sub`-keyed bucket.
- Request/response schemas live in a revived `admin` namespace of the contracts package. The Question completeness rule (text + four answers, one designated correct) is a zod refinement there, shared verbatim by the admin form and the API pipe. Aliases and misspellings are lowercased at the same contract seam.
- Entities gain the two flag columns; migrations are generated by Hugo from the entities, per house rule. Wire casing stays camelCase via column naming.
- The existing public catalog feature changes only by gaining the serving predicate and the Ready-only counts.
- Slugs are auto-generated from the name at creation (API-side), immutable thereafter, unique per the existing constraints.

### Theme images (ADR 0007)

- Bytes never transit the API: the browser validates format and minimum dimensions, downscales, encodes webp; the API mints a signed upload URL for the theme-images bucket; the browser PUTs directly to storage. The image column keeps holding a bucket path, never a URL.
- The browser pipeline keeps the injected-encoder shape of the prior art so it tests without a browser.

### Admin app

- The dashboard is client components driven by React Query over a thin BFF proxy: one route handler forwards admin API calls with the session's Bearer token; responses parse through the contracts at the seam. No direct browser→API calls.
- Eager load: all Categories + all Themes, each Theme row carrying total and Ready counts (this also feeds every modal's numbers with no extra endpoint). Lazy load: a Theme's Questions on first selection, cached.
- Explicit save: the save button enables on dirty + valid; navigating away from a dirty form warns. No autosave.
- Selection (category, theme, question) lives in URL query params via shallow routing.
- All columns ordered by creation date, newest first.
- The consequence modal belongs to the Theme's Published switch alone, both directions. Ready flips and other mutations are modal-free; the floor case uses a blocking popup.
- Category icon input autocompletes from the MaterialIcons glyphmap shipped by the vector-icons package, with webfont preview.
- Chips inputs split on comma, render chips, store lowercase.
- UI copy in English; the existing admin design system (sky-on-zinc, canvas + surface, one radius, existing table recipes) applies.

## Testing Decisions

Good tests here exercise external behavior at the highest existing seam — HTTP responses, contract parse results, pure function outputs — never internal wiring. Three seams, all pre-existing:

- **API feature e2e over HTTP** (prior art: the catalog and auth e2e suites): boot the full app with the repository faked at the repository seam and stub-JWKS tokens minted per role. Proves the guard boundary (401 anonymous, 403 player, 200 editor), completeness rejection with the error envelope, lowercase normalization, slug generation and immutability, and that toggle endpoints accept flag writes without threshold checks. The serving predicate lives in repository SQL, which this house proves by live smoke, not by faked-repo tests.
- **Contracts specs** (prior art: the app-namespace schema specs): the admin schemas' completeness refinement and lowercase coercion, proven once where both client and API consume them.
- **Admin pure-logic vitest** (prior art: the sign-out route test; the prior image-pipeline tests): slugify, comma-to-chips parsing, the gate computations (20-Ready unlock, floor block, delete guards, derived Visible), form→payload mapping, and the image pipeline via injected encoder.

No component-render tests, matching the repo-wide stance. No mobile tests: the served shape is unchanged.

## Out of Scope

- AI-proposed Misspellings (explicitly deferred; hand-typed chips for now).
- Any stored Category flag or Category toggle — Visible stays derived.
- Backfilling the existing catalog's flags — everything starts unpublished by decision.
- Mobile app changes of any kind: contracts served to the app keep their shape.
- Server-side enforcement of curation policy (thresholds, floors, delete guards) — recorded as a deliberate no in ADR 0008.
- Search, filtering or pagination inside the columns.
- Multi-editor concurrency handling (conflict detection, presence) — the editor pool is a hand-provisioned handful.
- Audit trail / change history.
- Localization of the dashboard.

## Further Notes

- Vocabulary is normative in the Catalog curation glossary (`apps/admin/CONTEXT.md`); the two decisions with teeth are ADR 0007 (storage bytes never transit the API) and ADR 0008 (curation rules live in the admin client).
- Hugo runs `migration:generate` after the entity edits land; the new columns ride existing granted tables, so no new SQL grant snippet is expected. The theme-images bucket already exists; its mime restriction should be checked when the signed-upload flow lands.
- Launch consequence to remember: the moment the flag columns deploy, the app's catalog is empty until Themes are re-published from this dashboard — harmless pre-launch, deliberate.
