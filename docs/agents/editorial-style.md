# Editorial style

The Editor's rules for Catalog copy, grown one correction at a time by the [daily question](daily-question.md) run.

## Counter

Questions brought to Ready by the daily run: **43**

## Themes

- **For now, only « Grand Theft Auto »** (Jeux vidéo), whatever section 2 of the daily run would pick, until the run has brought its 20 Questions to Ready. That day, tell the Editor the Theme reached 20 and ask whether to delete this rule; he answers yes or no.
  - The Theme started empty: each run writes a new Question (`POST /admin/questions`) on GTA — its cities, characters, studio, records, the world around it.
  - Ideas the Editor asked for: Scotland, the country where GTA was born; Red Dead Redemption, another game by GTA's publisher.
- « Acteurs de cinéma » is paused at 6/20, its Questions all ask « quel acteur… », « quelle actrice… ». A Theme names a world, not the kind of answer: here anything that makes a Player think of film actors — the film where one shines, a scene mocked online (Marion Cotillard's death scene), a star's way of life, a nickname, an award, a fact off screen. « Pharaons d'Égypte » and « Barbus célèbres » show the measure: rarely the person, always something tied to them.
- A Theme that always asks the same thing (« quel jeune pharaon… », « quel architecte… ») or is far too hard for Mentis: read all its Questions, not only the Ready ones, and steer each toward what they lack, rewriting it whole when needed.
  - Rewrite whole only a Question that repeats another (« quel jeune pharaon… ») or that few Players could answer. One that is already accessible and of a kind the Theme lacks is kept and polished (« l’ovale qui entoure le nom d’un pharaon » stays). Never turn it into a riddle made up from scratch.
  - A rewrite never trades a famous answer for a generic one behind a long, detailed setup: « Quelle légende est née en 1923, quand Lord Carnarvon… » → « la malédiction du pharaon » was refused, and « quel jeune pharaon… tombe découverte en 1922 » was kept on Toutânkhamon, its wording polished. Put such a side fact in the Explanation instead.
  - A hard Question whose fact is interesting is kept too: « Quelle cité nouvelle Akhenaton a-t-il fondée pour en faire sa capitale ? » was replaced by the Sphinx, and the Editor had it treated again as a Question of its own. Make it reachable through its wording and choices rather than replace it.
- Otherwise pick only an unpublished Theme with Questions left to bring to Ready. The Editor unpublishes a Theme himself when he wants the run back on it.
- Before polishing, read the Theme's Questions already Ready and steer this one toward what they lack, so the Theme mixes kinds as La Réunion does: history, places, objects, customs, a touch of pop culture, now and then a little logic — pleasant to answer, and every Player can get some of it right.
- Finished by the daily run, never to pick again: La Réunion, Pharaons d’Égypte.
- « En vrac » is no Theme a Player will ever see: its Questions wait to be moved into a real one. Pick it only when no other Theme has a Question left; then propose, with the polished Question, the existing Theme it should move to (its `themeId`), or a new Theme to create when none fits.

## Question text

- Reads like the Questions already Ready in its Theme: same register, same typography.
- Admits one Canonical Answer only.
- Answerable in Cash mode, typed without the four choices: the wording dictates the form of the answer. Ask for a name (« Quel genre musical… ? » → « Le maloya »), never for a definition (« Qu’est-ce que le maloya ? ») that a Player could phrase ten ways.
- No detail that lengthens the wording without helping find the answer: « Quel architecte de la pyramide de Djoser, la plus ancienne d’Égypte, a ensuite été vénéré… » lost « la plus ancienne d’Égypte ».
- A period that varies from year to year says so: « généralement de juin à octobre ».
- A scene or a line iconic enough to lead to the answer alone does without the work's title: « Quel acteur, assis sur un banc dans « Forrest Gump », compare la vie à une boîte de chocolats ? » lost « dans « Forrest Gump » » for a detail of the scene itself (« en attendant le bus »). A little harder, never out of reach.
- A clue whose name all but spells the answer is blurred: « Quelle ville imaginaire, inspirée de Los Angeles… » → « Los Santos » became « inspirée d’une grande ville américaine ».
- A person is found through who they were — their role, a deed, what their name means — never through where a work showing them is kept: « Quelle reine… est célèbre pour son buste exposé à Berlin ? » was refused; « Quelle reine d’Égypte, épouse d’Akhenaton, porte un nom qui signifie « la belle est venue » ? » was approved.

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
- Stays short: 400 is a ceiling, never a target. Four sentences and 324 characters on Cléopâtre were « un peu trop long »; two sentences, about 200 characters, are the measure.
- A figure is the one most sources cite, rounded (« environ 22 000 hectares, près de 55 % »), not the latest single-year count.
- Says what the answer is used for or known for, in one or two plain sentences that fill the room.
- When the answer is surprising, answer first the question it raises in the Player's head (« mais comment retirer le cerveau par le nez ?? »), in plain words, without anatomy or jargon; leave out the side details.
- A record says it was one « à l’époque »: « un milliard de dollars en trois jours, un record à l’époque ».
- A recurring competition names its latest winner, nationality and time (« En 2026, le Français Hugo Deck la gagne en 22 h 54 »).
- An actor goes in parentheses after the role he plays: « pour Cléopâtre (Monica Bellucci) », « l’architecte Amonbofis (Gérard Darmon) ».
- A character whose full name the film makes famous gets it whole, even when it already sits in an Alias: « le général Maximus Decimus Meridius (Russell Crowe) », not « le général Maximus ». A surname few Players remember stays out: « Rose (Kate Winslet) », not « Rose DeWitt Bukater (Kate Winslet) ».

## Anecdote

- A neighbouring fact on the subject the Question raises — it stands alone on the home, away from the Question.
- Shown without its Theme or Question, so it names its subject and situates it: what it is and where (« à La Réunion, le flamboyant, arbre… »).
- Never leans on a meaning the Player has not read: no « aussi », « également » pointing back to the Question (« un rougail est aussi un condiment » → « on sert à côté du cari un rougail tomate : un condiment de… »). An « aussi » that sets a second life against the first, both named in the sentence, is welcome: « L’acteur **Pierre Richard**, star de cinéma, est aussi vigneron… ».
- Never describe what a photo would show better (a shape, a colour, a size to see) — keep a fact worth remembering (an origin, a season, a cause, a record).
- When it fits, a few words say why the subject matters there (« première culture de l’île »); never at the cost of a clear sentence under 140.
- When the answer's name means something else to most Players — a catchphrase, a film gag — the Anecdote settles that link first: « Imhotep », for many the « Ça va, ça va, Imhotep » of Mission Cléopâtre, first says who the real one was, since most Players never knew (« sans rapport avec le vrai architecte » was refused: nobody knew he was one), then where the gag comes from: « **Imhotep** a conçu la première pyramide d’Égypte. Le « Ça va, ça va, __Imhotep__ » lancé pour rire, lui, vient de **Mission Cléopâtre**. »
- A fact drawn from a film or a work says plainly it is the film, and plainly where real life departs from it: anecdotes from every Theme come mixed on the home, so « L’empereur romain **Commode**, le méchant de Gladiator, a vraiment combattu… » left the Player unsure a film was meant; « Le méchant du film **Gladiator**, l’empereur romain **Commode**, a vraiment existé et combattait lui-même en __gladiateur__ dans l’arène. » says both.
- Factual, surprising, short, in the voice of the stored ones (`GET /app/anecdotes?n=50`).
- How a thing is served or used day to day is no Anecdote (« on sert à côté du cari un rougail tomate »): reach for what few Players know — an origin, a history, a record.
- An origin earns its place only when the Player sees the link at once and it leads somewhere unexpected (« boucané » → « boucan » → « boucanier ») — never a foreign word that looks nothing like ours (« rougail » ← tamoul « urukay »).
- Never a joke that only works if the Player already knows its background (an album that mocks a 1963 film's budget): when the fact needs its context explained to make sense, pick another fact.
- A fact that surprises by contrast spells the contrast out in plain words (« a bâti la plus grande pyramide d’Égypte, mais la seule statue entière de lui mesure à peine 7,5 cm »), never leaves the Player to infer it from an apposition.
- `**bold**` and `__italic__` lift the words that carry the fact; the markers count in the 140 characters.
- Read on another page than the Question, by a Player who never saw it: the first words name the subject and say plainly what it is, never a pronoun whose subject comes later, and the fact makes sense to someone who knows nothing of the topic. « Les pharaons d’Égypte l’ont porté pendant près de 3 000 ans, mais aucun **pschent**, leur double couronne, n’a jamais été __retrouvé__. » was not understood; « En Égypte ancienne, le **pschent** était la couronne des pharaons. Il orne des centaines de statues, mais aucun n’a jamais été __retrouvé__. » says what it is, then the fact.
- Plain full sentences a Player understands on first read: say plainly what a word means (« un **kabar** est une fête où… ») before telling where it comes from, never squeeze the meaning into an apposition. Use the room: close to 140 characters, not far under.
