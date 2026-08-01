---
name: notion-to-quiz
description: Treat a general-knowledge topic — lock one notion-cible with the curator, then produce 3 typed reading cards and 5 Cash/Carré quiz angles, ready for /quiz-to-feed.
argument-hint: [sujet en quelques mots]
disable-model-invocation: true
---

# notion-to-quiz — raw topic → locked notion → 3 cards + 5 quiz angles

From a few words (« Quelle république pour bonnet phrygien ? »), produce the precise notion the player must walk away with — one line, or a tight 1–3-line constellation — treated as 3 typed reading cards and 5 quiz proposals. All produced content is in French. The user is the **curator**: they lock the notion, they keep or drop each proposal.

## 0. Fact discipline (applies to every card, quiz and « Pour info »)

- Any **at-risk** claim — a named person, a date, a number, an attributed quote, a causal or interpretive link — must be traced to a primary or authoritative source you **actually opened** (WebFetch, or the page itself), never a search-engine's generated summary. A search summary helps you *find* the source; it is not the source. Facts of common knowledge need no sourcing.
- A **verified fact** and an **interpretation or official reading** are not the same thing. State the fact plainly; attribute the interpretation in-line (« selon l'État », « pour X ») — an official framing is not an encyclopedic fact.
- In the deliverable, **flag only what is uncertain, interpretive or single-source** (a short in-line « selon X »). Everything else stands unmarked, precisely because you verified it — no heavy sources apparatus.
- A false or fragile candidate is worse than a missing one. If a striking anecdote hangs on a single shaky source, drop it and build on facts the curator can check in one click.

## 1. Lock the notion-cible

The **notion-cible** is what the player must retain — a short equivalence « A = B », or a small **constellation of 1–3 reinforcing equivalences** when several facts of equal weight define the topic (« = attribut de Marianne », « = symbole laïque / liberté de conscience », « = IIIe République, mais pas que »). Keep it tight: 1–3 lines, no sprawl.

- `$ARGUMENTS` is the raw topic; nothing provided → ask the curator.
- Draft 2–4 candidate notions, each a different side of the topic (one line, or a tight constellation). Apply the fact discipline above *before* proposing — a candidate resting on an unverified at-risk claim is disqualified, not merely flagged.
- A topic can embed a false or fuzzy presupposition (« quelle république pour le bonnet phrygien ? » — aucune en particulier : c'est le symbole de la République elle-même). Say so; propose the corrected notion.
- Submit the candidates via AskUserQuestion, one line of rationale each. Iterate until the curator picks.

Locked = one notion-cible (1–3 lines), explicitly validated by the curator. Write nothing from steps 2–3 before the lock.

## 2. Treat the topic — 3 cards

Pick the 3 fittest types among the 4; the one you drop is the one whose raw material this topic lacks:

- **Un vrai ou faux** — there is an idée reçue to correct. « Affirmation. » → **Vrai / Faux**, puis la correction.
- **Une anecdote** — there is a concrete story: a person, a date, a place.
- **Le savais-tu** — the bare fact surprises on its own.
- **Une devinette** — the notion has evocative attributes. Énigme → réponse.

Each card: 4 short French sentences maximum. Done when the 3 cards use 3 distinct types and each card, read alone, plants the full notion.

## 3. Five quiz angles

Every proposal must play in both modes — **Cash** (free text, no clue, typed against the 25-second countdown) and **Carré** (4 choices shown). Per proposal:

**Q1 — angle : <2–4 mots>**
- Question : <énoncé, une seule réponse défendable>
- Réponse : <1 à 3 mots>
- Carré : **<réponse>** · <faux> · <faux> · <faux>
- Pour info : <2 phrases courtes qui développent le sujet pour le joueur curieux, au-delà de la réponse nue — faits vérifiés, interprétation signalée « selon X »>

- Five pairwise-distinct angles — each question enters the notion by a different face: le renversement (B→A : « Coiffé par Marianne, quel symbole de la République ? »), le porteur, l'origine, l'époque, le détail concret. Naming the angle forces the gap.
- Every answer, once learned, plants the notion-cible.
- Réponse : 1–3 words, sayable in one breath — never a sentence. One defensible answer per question; if several fit, tighten the énoncé.
- Wrong choices: same register and format as the answer, plausible, indisputably false.
- Pour info : exactly 2 short French sentences that teach a little beyond the bare answer — never a restatement of the question. Bound by the fact discipline: verified facts, any official reading flagged « selon X ».

Done when the 5 angles carry 5 different names, no two questions enter by the same face, and each carries its **Pour info**. Deliver in one message: notion-cible, 3 cards, 5 proposals. Aliases, misspellings, categories and feed.json live downstream — point the curator to `/quiz-to-feed` with the proposals they keep.
