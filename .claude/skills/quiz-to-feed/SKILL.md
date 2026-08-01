---
name: quiz-to-feed
description: Convert raw quiz questions (inline or from a file) into an enriched, self-contained theme file under `.feeds/` — schema, id, aliases, misspellings — per the calibrated Answer Matching rules.
disable-model-invocation: true
argument-hint: [questions brutes | chemin de fichier]
---

# quiz-to-feed — raw questions → enriched theme file (`.feeds/`)

Turn raw French quiz questions into a self-contained **theme file** under `.feeds/` — one quiz per file — ready for the curator to validate and promote toward the seed pipeline. Each question becomes `{question, answers[4], correctAnswer, id, aliases, misspellings}`. The user is the **curator**: everything you invent or change gets a **flag** in the final report for their review.

## Why aliases and misspellings behave differently

Answer Matching (ADR 0001) is deterministic: normalize → exact match vs Canonical + Aliases + Misspellings → bounded Levenshtein vs Canonical + Aliases only. Consequences:

- Normalization already forgives case, accents, œ→oe, punctuation, hyphens, apostrophes, leading articles (le/la/les/l'/un/une/des) and extra whitespace. Never spend an alias on those variants.
- Fuzzy thresholds (normalized length → max edits): ≤3→0, 4–6→1, 7–10→2, ≥11→3. Each alias opens its own fuzzy neighborhood — keep aliases precise: 2–6 per question.
- Misspellings match **exact-only** and open nothing — be generous: 5–8+ when the word invites it.
- Purely numeric input gets zero tolerance.

## Enrichment rules (curator-validated)

Aliases — include every form matching one of these rules, nothing else:

- **Usage courant** — surname (or mononym) alone iff people commonly call the person that: Einstein, Mozart, Piaf, Schumi ✓ — Mercury (Freddie), Davis (Miles) ✗; ambiguous surname ✗ (Hepburn: Katharine vs Audrey).
- **VO très connue** — world-famous original/foreign forms: Darth Vader, Frodo Baggins, The Godfather, Leonardo da Vinci ✓ — obscure local forms ✗ (Firenze).
- **Équivalent factuel** sans ambiguïté — another true designation of the same thing: Cassius Clay, Anakin Skywalker, Hercule, CO2 / gaz carbonique, 23 paires, 1h30 ✓ — a related-but-different entity ✗ (Meta for Facebook, Jupiter for Zeus) — an answer that repeats the question's own words ✗ (« IA » when the question asks what IA stands for).
- **Mot distinctif** — the distinctive word alone when the question already carries the generic (« quel traité… » → Versailles ✓, « quel détroit… » → Gibraltar ✓) — ✗ when the qualifier IS the information (baleine for baleine bleue, sterne for sterne arctique, Corse for Corse-du-Sud).
- **Forme nue** (mandatory) — a canonical with a preposition (« Au Japon », « Du piano », « De l'Australie ») always gets the bare form (Japon, piano, Australie): normalization does NOT strip en/au/du/de.
- **Chiffres ↔ lettres** — word-number canonicals get digits (« Onze » → « 11 ») plus echo forms (« 11 joueurs », « 8 pattes »); years get « en XXXX » and the spelled-out form; complex numeric formats get every plausible typing (« 6,02 × 10^23 » → « 6.02e23 », « 6,02x10^23 », …).

Misspellings — plausible French phonetic wrong spellings, the « krisantème » spirit: k/c/qu, f/ph, doubled or dropped consonants, silent letters, francizations (Alain Turing, Salvatore Dali), sound-alike renderings (Ouaterloo, Cheikspir, Fessebouc). Within-threshold typos are acceptable padding; the value is beyond-threshold forms.

Never: an alias or misspelling equal to the canonical; duplicates; variants normalization already covers. Some canonicals have nothing honest to add (« Au », chemical symbol): empty arrays are correct — state why in the report.

## Steps

1. **Collect.** `$ARGUMENTS` is either raw question text or a path: if it names a readable file, Read it; otherwise treat the argument text (and any pasted block) as the questions. Accepted states per question: text alone, text + answer, text + 4 choices (± correct one marked). Nothing provided → ask the curator.
2. **Complete to schema.** The theme is the file itself: take its slug + French name from the input's `id`/`name` (derive and flag them if the input omits them). Flag « nouveau thème » when the slug isn't already a theme in `feed.json`; a theme under 10 questions is not Draw-eligible (flag it). For each question: establish the Canonical Answer — missing → answer it yourself and flag « réponse déterminée — à vérifier »; a source typo in the canonical (missing accent, etc.) → correct it and flag « réponse corrigée ». Complete to exactly 3 wrong choices in the same register and difficulty (generated ones flagged), and spread the canonical across all four positions (never leave an index unused). Done when the theme has a slug + name and every question has 4 answers and a correctAnswer.
3. **Enrich** per the rules above. Done when every question has aliases and misspellings arrays, empty ones justified.
4. **Write the theme file.** Emit one self-contained file into `.feeds/` (create the folder if absent — it is git-ignored). Name it `{NNN}-{slug}-{state}.json`: `NNN` zero-padded, sequential after the highest number already in `.feeds/` (`001` for the first); `slug` from the input's `id`; `state` is `default` for a fresh generation. Shape mirrors a `feed.json` theme — `{ id, name, questions: [ { question, answers[4], correctAnswer, id, aliases, misspellings } ] }` — so it drops straight into `feed.json`'s `themes[]` later. Question ids are `{slug}-NNN`, zero-padded, sequential from `001`. The curator later promotes the file `default → ready → published` as they validate and seed it (rename the state suffix). Done when `jq empty` passes, every question has 4 answers, an in-range `correctAnswer`, an id, and aliases + misspellings arrays, and no alias/misspelling normalizes to its canonical (verify with the `normalize` from `src/features/quiz/matching.ts`).
5. **Report.** One table: id, canonical, #aliases, #misspellings, flags (réponse à vérifier / réponse corrigée / choix générés / nouveau thème / tableaux vides). Name the output file and the correct-index spread. The curator validates every flag before promoting the file.
