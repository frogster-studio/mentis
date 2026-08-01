# PRD — Mentis : Themes replace Categories

## Problem Statement

Choosing a quiz subject in Mentis feels like picking a school class. The broad Categories (« Histoire », « Géographie »…) are generic and uninspiring: they promise homework, not fun, and they say nothing about what the questions will actually be about. The catalog is static — the same handful of Categories forever — so there is nothing new to come back for tomorrow. The home screen makes it worse by listing every unplayed Category as a grayed ghost card: a permanent reminder of a to-do list rather than a record of play. And behind the scenes, a Question can belong to several Categories at once, which blurs what a Category even is and makes content authoring rules convoluted.

## Solution

Replace Category with **Theme**: a narrow, evocative subject — « Marie Antoinette », « Les Simpson », « Coupe du Monde de Football », « Chocolats ». Themes are added to the pool day by day, so the game keeps offering something new. When the Player hits « Jouer », the Draw offers **10** random eligible Themes in a scrollable list; tapping one starts a Quiz Session immediately, exactly as today. Every Question belongs to **exactly one** Theme — overlap between Themes is handled editorially by duplicating a question under a new id, never by linking. The home screen becomes a trophy shelf: only Themes the Player has actually finished a session in appear, each with its Theme Average, sorted descending — no ghosts. The product is pre-launch, so the old category content is discarded outright and replaced by a fresh feed of 10 Themes × 20 Questions. Session mechanics (Cash/Carré, Countdown, scoring, end-of-session reveal) are untouched.

## User Stories

### Home & progression

1. As a Player, I want the home screen to show a card for every Theme in which I have finished at least one Quiz Session, so that my home is a record of what I have actually played.
2. As a Player, I want each home card to display that Theme's Theme Average out of 50, so that I can see at a glance where I excel and where I struggle.
3. As a Player, I want my home cards sorted by Theme Average descending, so that my strongest Themes greet me first.
4. As a Player, I want Themes I have never played to be absent from the home screen, so that a pool growing day by day never buries my results under an endless ghost list.
5. As a first-time Player, I want a clean home with just the logo and the « Jouer » button, so that the path to my first session is unmissable.
6. As a Player, I want my home cards rendered from data stored on my device, so that my results appear instantly even offline.
7. As a Player, I want a finished session to update the matching home card the moment I return home, so that the home screen always reflects reality.

### The Draw & the picker

8. As a Player, I want « Jouer » to offer me a Draw of 10 random Themes, so that every session starts with a fresh, constrained choice instead of a paralyzing full catalog.
9. As a Player, I want the 10 Theme cards in a vertically scrollable full-width list, so that long French names like « Les expressions françaises » stay fully readable.
10. As a Player, I want the picker titled « Choisis un thème », so that the screen says exactly what I am doing.
11. As a Player, I want only Themes with at least 10 linked Questions to be eligible for the Draw, so that a session can never run short of questions.
12. As a Player, I want every eligible Theme offered when fewer than 10 are eligible, so that the game still works in its earliest days.
13. As a Player, I want the Draw to stay stable while the picker is open and to re-roll only on a fresh visit, so that the offer doesn't shift under my finger.
14. As a Player, I want tapping a Theme card to start the session instantly — no confirmation, no re-roll — so that I reach question 1 in two taps from home.
15. As a Player, I want a French error message when the Themes cannot load, so that a network failure never leaves a silent blank screen.

### A growing pool

16. As a Player, I want Themes added day by day to appear in my Draws without updating the app, so that the game keeps surprising me.
17. As a Player, I want successive Draws sampled uniformly at random from the whole eligible pool, so that replaying keeps surfacing different Themes.

### Playing a Theme

18. As a Player, I want my Quiz Session to be 10 Questions all belonging to the single Theme I chose, so that a run has one coherent subject.
19. As a Player, I want the Theme name displayed with my final score, so that the verdict names its subject.
20. As a Player, I want « Rejouer » on the results page to trigger a fresh Draw of 10, so that the next session starts with new options rather than grinding one Theme.
21. As a Player, I want every session mechanic unchanged — 25-second Countdown, Cash by default, one-way switch to Carré, 5/2 points, reveal only at the end — so that everything I know about the game carries over.
22. As a Player who quits mid-session, I want the Abandoned Session to leave no trace on any Theme, so that my Theme Averages reflect only completed runs.

### Content authoring

23. As a content author, I want the feed organized as Themes each owning their Questions, so that one-Theme-per-Question is enforced by the data's shape rather than by discipline.
24. As a content author, I want to reuse a question in a second Theme by duplicating it under a new id, so that overlap between Themes stays my editorial call with zero pipeline resistance.
25. As a content author, I want the pipeline to reject any question id appearing twice anywhere in the feed, so that an accidental double-listing cannot reach the database.
26. As a content author, I want duplicate Theme ids, empty ids or names, and questions without exactly 3 wrong choices rejected at transform time, so that broken content fails loudly on my machine instead of silently in production.
27. As a content author, I want seeding to replace the hosted content with the feed's content, so that the feed file remains the single source of truth.
28. As a content author, I want to launch with 10 Themes of 20 Questions each, so that every launch Theme is comfortably above the eligibility floor.

### Clean slate

29. As the product owner of a pre-launch app, I want the old category data dropped outright — no remapping, no migration code — so that the codebase carries zero legacy weight.
30. As a Player holding an old development build, I want obsolete locally-persisted category stats to be silently abandoned rather than crash the app, so that moving to Themes is invisible.

## Implementation Decisions

- **Vocabulary**: Theme replaces Category across the entire codebase — types, functions, constants, route params, comments, UI copy. French UI label « Thème ». The glossary has been updated; "category" is now avoided vocabulary.
- **Schema**: a `themes` table (slug id, name) replaces `categories`; each question carries a required reference to its one Theme; the question↔category junction table disappears. The random-questions RPC is recreated to take a theme slug, keeping its contract (10 random questions of that theme, security invoker through anon read-only RLS). The old quiz content tables and their data are dropped — clean slate, pre-launch. Pre-existing unrelated tables stay untouched.
- **Feed contract**: the feed nests Questions inside the Theme that owns them. Question ids are globally unique — the same id under two Themes is an authoring error (this inverts the old rule, where cross-category duplication was the sharing mechanism). Reusing a question in another Theme means a new id and a new entry, and that is endorsed, not policed: no text-similarity detection of any kind.
- **Draw**: same algorithm as today (uniform partial Fisher–Yates over the eligible pool, RNG injected), with the draw size raised from 4 to 10. Eligibility stays ≥ 10 linked Questions; when fewer than 10 Themes are eligible, all of them are returned. One Draw per picker visit, fresh Draw on « Rejouer ».
- **Device stats**: still a device-local persisted store keyed by Theme id, but each entry now stores the Theme **name** (captured when the session is recorded) alongside total points and session count. Theme Average remains derived, never stored. Home cards are computed from the stats store alone — played Themes only, sorted by average descending — so the home screen no longer queries the catalog at all. The persistence key is renamed, which orphans old-format data harmlessly (free reset, pre-launch). A Theme renamed server-side keeps its old name in existing device stats — accepted trade-off.
- **Home**: the ghost-card concept and its placeholder value are deleted.
- **Picker**: the existing full-width card style, stacked in a vertical scrollable list.
- **Session**: route parameterized by Theme id with the name passed along, as today. Everything downstream of choosing a Theme (question fetch, reducer, countdown, matching, scoring, results, quit dialog) is behaviorally untouched.
- **Copy**: all new French strings live in the quiz feature's constants, per project convention.

## Testing Decisions

- A good test exercises the **external behavior of a pure seam** — inputs to outputs, with randomness and time injected — never implementation details, and never component rendering (v1 convention holds).
- **Seed transform seam** (existing suite, adapted): a fixture in the new themes-own-questions shape asserts the produced theme rows and question rows carrying their theme reference, and the launch-scale totals (10 × 20). Rejection cases: a question id duplicated anywhere (including across two Themes — the inverted rule deserves an explicit test), duplicate theme ids, structural field errors.
- **Draw seam** (existing suite, adapted): draw size 10, eligibility filtering at the ≥ 10 boundary, all-eligible fallback below 10, determinism under a seeded RNG, distinctness, input immutability.
- **Stats seam** (existing suite, adapted to the interface change): recording a finished session captures the Theme name; accumulation across sessions; independence between Themes; zero-point sessions still count; average derivation; home cards from stats alone — played-only, sorted descending; no input mutation.
- **Constants**: the existing French-copy sanity test pattern extends to the new strings.
- **Untouched suites stay green**: matching (per the deterministic-matching ADR), session reducer, countdown, shuffle.
- **Live verification script** (not vitest, runs against the hosted database): anon can read themes and questions, cannot write, and the RPC returns 10 distinct questions all belonging to the requested Theme.

## Out of Scope

- Any browse-the-full-catalog, search, or theme-discovery UI; picker pagination or a manual re-roll button.
- Editorial tooling for theme rotation or scheduling; theme metadata (icons, colors, descriptions, difficulty).
- Similarity or duplicate-text detection in the seed pipeline.
- Any change to session mechanics: session length, Countdown, Cash/Carré, scoring, Answer Matching, results.
- Server-side stats, accounts, or any migration of existing device stats.
- Retro-updating persisted Theme names after a server-side rename.

## Further Notes

- **Duplication over linking** is the deliberate resolution of question overlap between Themes (e.g. a dairy question fitting both « Les animaux de la ferme » and « Les produits laitiers »): the author files it once, and duplicates under a new id if the other Theme needs it. This is recorded in the glossary's Question entry and is a candidate for a short ADR if desired.
- The domain term **Theme** is unrelated to the project's banned UI `theme/` folder convention — colors remain in the shared palette module per the standing project decision.
- The launch feed **replaces** the old one entirely; old broad-category content is discarded, not remapped.
