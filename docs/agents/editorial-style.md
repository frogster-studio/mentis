# Editorial style

The Editor's rules for Catalog copy, grown one correction at a time by the [daily question](daily-question.md) run.

## Counter

Questions brought to Ready by the daily run: **10**

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
- Never describe what a photo would show better (a shape, a colour, a size to see) — keep a fact worth remembering (an origin, a season, a cause, a record).
- When it fits, a few words say why the subject matters there (« première culture de l’île »); never at the cost of a clear sentence under 140.
- Factual, surprising, short, in the voice of the stored ones (`GET /app/anecdotes?n=50`).
- `**bold**` and `__italic__` lift the words that carry the fact; the markers count in the 140 characters.
- Plain full sentences a Player understands on first read: say plainly what a word means (« un **kabar** est une fête où… ») before telling where it comes from, never squeeze the meaning into an apposition. Use the room: close to 140 characters, not far under.
