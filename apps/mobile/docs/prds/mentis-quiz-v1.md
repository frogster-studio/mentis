# PRD — Mentis v1 : quiz « Cash ou Carré »

## Problem Statement

Quiz players face a frustrating trade-off in existing apps. Multiple-choice-only games remove the thrill of *knowing* — recognizing an answer among four options is a shallower victory than producing it. Free-text games, meanwhile, punish the player for being human: a missing accent, a typo, or an alternate name (« USA » instead of « États-Unis ») is scored as a failure even when the player plainly knew the answer. On top of that, most quiz apps give no sense of per-theme progression, and many gate play behind account creation.

## Solution

Mentis is a French general-knowledge quiz for iOS, Android and Web (single codebase). A Quiz Session is 10 questions from one Category, picked from a Draw of 4 random Categories. Each Question runs a 25-second Countdown and offers the signature choice: answer **Cash** (free text, no clues, 5 points) or bail out one-way to **Carré** (4 choices shown, 2 points). Free-text answers are judged by a deterministic on-device Answer Matching pipeline that forgives case, accents, articles, typos and alternate forms — the "human feeling" of a host who knows what you meant — instantly and offline. Results are revealed only at the end of the session; the home screen tracks a Category Average per played Category. No account, minimal taps: two taps from home to question 1.

## User Stories

### Home & progression

1. As a Player, I want the home screen to show my Category Average for every Category I have played, so that I can see at a glance where I excel and where I struggle.
2. As a Player, I want those averages sorted descending, so that my strongest Categories greet me first.
3. As a Player, I want Categories I have never played to appear as grayed ghost cards with their real names, so that I can discover what themes exist before committing to play.
4. As a Player, I want a single prominent « Jouer » button pinned at the bottom of the home screen, so that starting a game is always one thumb-tap away.
5. As a first-time Player, I want to play without creating an account or logging in, so that nothing stands between me and my first question.

### Starting a session

6. As a Player, I want to be offered a Draw of 4 random Categories when I start, so that every session begins with a fresh, constrained choice instead of paralyzing full catalogs.
7. As a Player, I want only Categories with enough questions to be eligible for the Draw, so that a session can never run short of questions.
8. As a Player, I want tapping a Category card to start the session instantly — no confirmation, no re-roll — so that I reach question 1 in two taps from home.

### Answering Cash

9. As a Player, I want each Question to appear with the input focused and the keyboard already open, so that I can start typing the instant the Countdown starts.
10. As a Player, I want the Question text always visible and scrollable above the open keyboard, so that a long question is never hidden while I type.
11. As a Player, I want a visible circular 25-second Countdown, so that I can budget my thinking time.
12. As a Player, I want a « n/10 » progress badge, so that I always know where I am in the session.
13. As a Player, I want whatever text currently stands in the input to count as my Answer when the Countdown expires, so that I am never obliged to tap a confirm button.
14. As a Player, I want to confirm early once I have typed at least one character, so that I can move on without waiting out the clock.
15. As a Player, I want the keyboard's native confirm key to dismiss the keyboard (not submit) and reveal the optional « Valider » button, so that I can re-read the question calmly before committing.
16. As a Player, I want my free-text answer judged with tolerance for case, accents, leading articles, misspellings and legitimate alternate forms, so that knowing the answer is enough even if I type it imperfectly.
17. As a Player answering with a number or a date, I want exact matching only, so that a wrong year is never accepted as "close enough".

### Switching to Carré

18. As a Player unsure of my answer, I want an always-visible button to switch to Carré and reveal 4 choices, so that I can trade points for certainty at any moment.
19. As a Player, I want the switch to Carré to be one-way and to discard my typed input, so that the Cash bonus keeps its meaning.
20. As a Player in Carré, I want to select a choice and still change my mind until the Countdown ends, so that one mis-tap is not fatal.
21. As a Player in Carré, I want the same « Valider » button to confirm my selection early, so that both modes share one mental model.
22. As a Player, I want the Countdown to keep running through the mode switch, so that the 25 seconds stay a hard budget for the whole question.

### Session integrity

23. As a Player, I want to quit mid-session via an X with a French confirmation dialog, so that I can escape a bad run without an accidental tap destroying it.
24. As a Player who quits, I want the Abandoned Session to leave no trace in my stats, so that my Category Averages reflect only completed runs.
25. As a Player interrupted by a call or app switch, I want the Countdown anchored to real time — losing at most the current question — so that interruptions are survivable but backgrounding the app to look up answers is pointless.
26. As a Player, I want no right/wrong feedback between questions, so that the tension holds until the final reveal.

### Results

27. As a Player, I want my total score out of 50 with the Category name displayed at the end, so that I get an immediate verdict on the run.
28. As a Player, I want all 10 Questions listed with my Answer, the Canonical Answer whenever mine differed, the mode I played and the points earned, so that I learn from every mistake.
29. As a Player, I want correct and wrong rows visually distinct (green/red), so that I can scan the outcome at a glance.
30. As a Player, I want a « Rejouer » button leading to a fresh Draw, so that the next session starts with new options rather than grinding one Category.
31. As a Player, I want my Category Average updated the moment a session finishes, so that the home screen always reflects reality.

### Platform & content

32. As a Player on iOS, Android or Web, I want identical behavior from a single codebase, so that I can play anywhere.
33. As a French-speaking Player, I want every piece of UI copy in French, so that the app feels native.
34. As the content curator, I want the question bank maintained in one JSON file that a script transforms and seeds into the database, so that a content update is one command.
35. As the content curator, I want AI-proposed Aliases and Misspellings that I review before they ship, so that answer fairness scales without hand-writing every variant.
36. As the content curator, I want a Question attachable to several Categories, so that good content is reusable across themes.

## Implementation Decisions

- **Feature shape**: a single `quiz` feature module owns the whole flow (home stats, picker, session, results); router files stay thin re-exports/compositions. Shared primitives live outside the feature. Domain types live in one canonical types module.
- **Stack**: Expo (latest SDK, TypeScript, Expo Go-compatible — no dev-build-only libraries), expo-router for navigation, TanStack Query for server data, zustand for in-flight session state, supabase-js using the project's new-format publishable key, AsyncStorage for device-local stats, react-native-svg for the countdown ring, Lucide as the exclusive icon set.
- **Visual system**: colors come exclusively from the 12-token COLORS module (surface, panel, fill, fillOpposite, strokeDefault, strokeStrong, primary, textMuted, green50, green500, red50, red500). The green/red pairs are reserved for the results page. System font, regular and bold only. The existing SVG logo is the only brand asset.
- **French copy**: all UI strings defined in the feature's constants module. The modes are labeled « Cash » and « Carré »; code identifiers stay English (`cash`/`square`).
- **Database (Supabase, existing linked project)**: three tables — `categories` (slug id, French name), `questions` (text, canonical answer, aliases array, misspellings array, exactly 3 wrong choices), and a question↔category junction. RLS grants anonymous SELECT only; the app never writes. A database RPC returns 10 random questions for a category; the 4-category Draw is sampled client-side among eligible Categories (≥ 10 linked questions), uniformly, no re-roll. Recorded trade-off: correct answers ship to the device during play (required for instant on-device scoring; acceptable while there is no leaderboard). A pre-existing unrelated `cards` table in the hosted project is left untouched.
- **Answer Matching** (per ADR 0001 — deterministic, on-device, no runtime AI): normalize (lowercase, accent folding, punctuation stripping, leading French article stripping, whitespace collapse) → exact match against Canonical Answer + Aliases + Misspellings → bounded Levenshtein with length-scaled thresholds against Canonical Answer and Aliases only (never against Misspellings). Purely numeric answers get zero tolerance.
- **Session state machine** (pure reducer consumed by the store): Cash is the initial mode; switching to Carré is one-way and wipes the input; the standing answer (input text or selected choice) is submitted when the wall-clock Countdown expires — the Countdown is an absolute end-timestamp, immune to backgrounding and timer throttling, so at most the current question is sacrificed to an interruption; early confirmation is allowed once the answer is non-empty; advancing is instant with the keyboard kept open and input cleared; the X triggers a confirmation dialog and a confirmed quit discards the session entirely.
- **Scoring**: +5 per correct Cash answer, +2 per correct Carré answer, 0 otherwise; session total out of 50.
- **Device stats**: per-category `{ totalPoints, sessionCount }` persisted locally; Category Average is derived (never stored), displayed with French decimal formatting; only finished sessions mutate stats.
- **Seeding pipeline**: a script reads the content JSON (categories with nested questions; the correct answer identified by index among 4), derives canonical answer + wrong choices, enriches with AI-proposed Aliases and Misspellings for curator review, and upserts idempotently using the secret key from a git-ignored env file.
- **Quality tooling**: biome (lint), vitest (test), knip, and a chained `check` including typecheck. The first implementation issue sets up this tooling; every subsequent issue must end with `check` green.

## Testing Decisions

A good test exercises **observable behavior at a seam** — inputs in, outcomes out — never internal structure. All v1 tests are vitest tests against pure TypeScript; randomness and time are injected (seedable RNG, explicit clock/timestamps) so every test is deterministic. There is no prior art in the repo; these tests establish the house pattern. No component rendering tests in v1 — screens are thin shells over the tested logic.

The six seams under test:

1. **Answer Matching** — a rich French corpus: accents, case, articles, hyphens/apostrophes, typos at each length tier, aliases, misspellings (exact-only), numeric strictness, and near-miss rejections.
2. **Session state machine** — the full transition table: one-way mode switch wiping input, standing-answer submission on expiry, early confirm gating, advance, finish, abandon.
3. **Draw & question sampling** — eligibility filtering, uniform 4-category draw, 10 distinct questions, deterministic under injected RNG.
4. **Scoring & stats** — 5/2/0 attribution, session totals, stats accumulation and Category Average derivation including French rounding/formatting edge cases.
5. **Countdown math** — remaining-time derivation from an end-timestamp, expiry boundary behavior.
6. **Seed transform** — content JSON in, database row shapes out (canonical extraction by index, wrong-choice split, junction rows), validated against a golden sample.

## Out of Scope

- Accounts, authentication, cloud-synced history, cross-device stats.
- Leaderboards, social features, sharing.
- Runtime LLM answer judging (a batched at-results-time fallback is a candidate for v2, per ADR 0001).
- Pausing or resuming a session; any persistence of in-flight sessions.
- Cross-session question deduplication (repeats across sessions are accepted).
- Difficulty levels, joker/duo mechanics, timed bonuses.
- Content administration UI (content lives in the JSON + seed pipeline).
- Languages other than French; dark mode (single light theme per the palette).
- Anti-cheat hardening beyond the recorded ship-answers-to-device trade-off.
- Rendering tests, E2E tests, custom fonts, push notifications.

## Further Notes

- The domain vocabulary used here (Draw, Category Average, Cash, Carré, Canonical Answer, Alias, Misspelling, Answer Matching, Quiz Session, Abandoned Session, Countdown) is normative and defined in the root glossary; ADR 0001 governs the matching approach.
- LoFi wireframes exist for the home screen and the Cash question screen and are the layout reference; the picker, Carré layout (2×2 grid) and results page derive from the decisions above.
- Content is ready: 10 categories × 20 validated questions. Alias/Misspelling enrichment happens in the seed pipeline, not in the source JSON's current shape.
- The hosted Supabase project is already linked; migrations apply via CLI push, seeding requires the curator's secret key locally.
