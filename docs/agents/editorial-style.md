# Editorial style

The Editor's rules for Catalog copy, grown one correction at a time by the [daily question](daily-question.md) run.

## Counter

Questions brought to Ready by the daily run: **12**

## Themes

- **For now, only « Pharaons d'Égypte »**, whatever section 2 of the daily run would pick, until the run has brought its 20 Questions to Ready. That day, tell the Editor the Theme reached 20 and ask whether to delete this rule and its two companions below; he answers yes or no.
  - The Theme is far too hard for Mentis and always asks the same thing (« quel jeune pharaon… », « quel architecte… »): mostly people. Before polishing its Question, read the Theme's other Questions and steer this one toward what they lack, rewriting it whole when needed.
  - A Theme mixes kinds, as La Réunion does: history, places, objects, customs, a touch of pop culture, now and then a little logic — and every Player can answer some of it.
- Finished by the daily run, never to pick again: La Réunion.
- Every other Theme was curated by hand, Ready or not: none is exempt from a pass by the run.
- « En vrac » is no Theme a Player will ever see: its Questions wait to be moved into a real one. Pick it only when no other Theme has a Question left; then propose, with the polished Question, the existing Theme it should move to (its `themeId`), or a new Theme to create when none fits.

## Question text

- Reads like the Questions already Ready in its Theme: same register, same typography.
- Admits one Canonical Answer only.
- Answerable in Cash mode, typed without the four choices: the wording dictates the form of the answer. Ask for a name (« Quel genre musical… ? » → « Le maloya »), never for a definition (« Qu’est-ce que le maloya ? ») that a Player could phrase ten ways.
- A period that varies from year to year says so: « généralement de juin à octobre ».

## Wrong choices

- Each is the same kind of thing as the Canonical Answer.
- Square mode stays a mild challenge: plausible to a Player who half-knows, and beyond argument wrong.
- One may be a wink rather than a lookalike (« L’étranger » beside « Un malbar », « Un zarabe »): keep the author's when it makes the Player smile.

## Aliases and Misspellings

- Every legitimate name and every obvious wrong spelling a Player would type, minus what `packages/answer-matching/src/matching.ts` already accepts through normalization and typo tolerance.
- Spell it the way it sounds, slips of the ear as well as of the hand: a letter heard as another, a doubled consonant (« maloya » → « mallola », « malolla »). Keep each one the matcher refuses.
- Also list the bare spellings of the answer and of its short Alias (« zoreil », « zorey »), even when the matcher already accepts them.

## Explanation

- 400 characters at most, the limit of the contract: only the Anecdote is held to 140. Keep what was approved and add to it rather than cut it to fit.
- A figure is the one most sources cite, rounded (« environ 22 000 hectares, près de 55 % »), not the latest single-year count.
- Says what the answer is used for or known for, in one or two plain sentences that fill the room.
- A recurring competition names its latest winner, nationality and time (« En 2026, le Français Hugo Deck la gagne en 22 h 54 »).

## Anecdote

- A neighbouring fact on the subject the Question raises — it stands alone on the home, away from the Question.
- Shown without its Theme or Question, so it names its subject and situates it: what it is and where (« à La Réunion, le flamboyant, arbre… »).
- Never leans on a meaning the Player has not read: no « aussi », « également » pointing back to the Question (« un rougail est aussi un condiment » → « on sert à côté du cari un rougail tomate : un condiment de… »).
- Never describe what a photo would show better (a shape, a colour, a size to see) — keep a fact worth remembering (an origin, a season, a cause, a record).
- When it fits, a few words say why the subject matters there (« première culture de l’île »); never at the cost of a clear sentence under 140.
- Factual, surprising, short, in the voice of the stored ones (`GET /app/anecdotes?n=50`).
- How a thing is served or used day to day is no Anecdote (« on sert à côté du cari un rougail tomate »): reach for what few Players know — an origin, a history, a record.
- An origin earns its place only when the Player sees the link at once and it leads somewhere unexpected (« boucané » → « boucan » → « boucanier ») — never a foreign word that looks nothing like ours (« rougail » ← tamoul « urukay »).
- `**bold**` and `__italic__` lift the words that carry the fact; the markers count in the 140 characters.
- Plain full sentences a Player understands on first read: say plainly what a word means (« un **kabar** est une fête où… ») before telling where it comes from, never squeeze the meaning into an apposition. Use the room: close to 140 characters, not far under.
