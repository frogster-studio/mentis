# Mentis

A cross-platform (iOS/Android/Web) general-knowledge quiz app in French. The core twist: for every question the player chooses to answer freely with no clues ("cash") for more points, or reveal four choices ("square") for fewer points.

## Language

**Player**:
The person playing. Plays anonymously by default; signing into an Account is optional and never required for solo play.
_Avoid_: user

**Account**:
The optional cross-platform identity a Player signs into with Google or Apple. It exists to carry stats across devices and to ground future social features (leaderboards, battles); solo play never requires one. French UI label: « Compte ».
_Avoid_: user, profile, login

**Premium**:
The paid tier of an Account — one auto-renewable monthly subscription (€2.99, no trial) bought through the stores, never available to an anonymous Player. Requires only a signed-in Account, no pseudo. Eligibility is evaluated at the moment of the action against the entitlement's expiry: lapsed means free tier immediately, but never mid-session; store grace periods count as active. French UI label: « Premium ».
_Avoid_: subscriber, pro, VIP

**Quiz Session**:
One practice run of 10 Questions drawn from a single Theme chosen by the player. It is Finished once all 10 Questions have resolved; only Finished sessions produce a score (revealed at the end) and feed Theme Averages. French UI label: « partie ».
_Avoid_: game, round, quiz (alone)

**Abandoned Session**:
A Quiz Session quit (via the X, after confirmation) before all 10 Questions resolve. It leaves no trace: no score, not counted anywhere, never shown again.
_Avoid_: paused session, saved game

**Competition Session**:
The play-through of an Attempt: 10 Questions on one server-drawn Theme, same Countdown and Cash/Square rules as practice, score revealed at the end — but judged and scored by the server, and always recorded, quit included. Requires an Account with a pseudo. French UI label: « compétition ».
_Avoid_: ranked game, daily quiz

**Attempt**:
One server-issued competition quiz — a Theme and 10 Questions drawn for one Player and fixed at issuance — and its recorded outcome. Once issued it is consumed: finished, quit or expired, it counts. A Competition Day holds at most one initial Attempt, one Replay, one Catch-up.
_Avoid_: try, run

**Replay**:
A premium Player's second Attempt of the same Competition Day, always with a new Theme and new Questions — never the same ones again. The day keeps the best of the two scores.
_Avoid_: retry, same quiz again

**Catch-up**:
A premium Player's Attempt for yesterday's Competition Day, available only when yesterday holds no Attempt and both days are in the same season. Its own Theme and Questions, points attributed to yesterday, no Replay on it. French UI label: « rattrapage ».
_Avoid_: makeup, late play

**Competition Day**:
The Europe/Paris calendar date an Attempt is attributed to. It bounds the 50-point cap, the Theme rotation and the once-per-kind rule — whatever the Player's own timezone.
_Avoid_: day (alone)

**Theme**:
A narrow, specific subject (« Marie Antoinette », « Les Simpson », « Chocolats ») — not a broad school-style category. Every Question belongs to exactly one Theme. The pool of Themes grows over time. French UI label: « Thème ».
_Avoid_: category, topic, sujet

**Draw**:
The 10 Themes offered on the picker screen after « Commencer », sampled uniformly at random (no re-roll) among eligible Themes — those with at least 10 linked Questions. If fewer than 10 Themes are eligible, all of them are offered. No Draw happens on the results page: « Rejouer, même thème » starts a new Quiz Session on the same Theme.
_Avoid_: random themes, selection

**Theme Average**:
The average of the Player's finished Quiz Session scores in one Theme, out of 50. Shown on the home screen only for Themes played at least once, sorted descending; unplayed Themes don't appear there.
_Avoid_: score (alone), stats, best score

**Device Stats**:
The per-Theme stats a device accumulates while no one is signed in. Shown on home when signed out; they leave the device only through a Stats Transfer.
_Avoid_: local stats, history

**Account Stats**:
All Quiz Sessions recorded under an Account across its devices, plus any transferred Device Stats. Shown on home while signed in.
_Avoid_: cloud stats, synced stats

**Stats Transfer**:
The one-time, consented move of a device's Device Stats into an Account at sign-in. A move, not a copy: transferred stats leave the device world. Declining leaves them dormant on the device, hidden while signed in.
_Avoid_: merge, import

**Stat Baseline**:
The per-Theme totals (points, session count) a Stats Transfer deposits under an Account, frozen at transfer time. Keyed by (Account, device, Theme).
_Avoid_: baseline (alone), transferred stats

**Question**:
A prompt tied to exactly one Theme, answerable in both modes: it has one canonical correct answer and exactly 3 wrong choices for Square mode. Similar — even identical — wording may exist under different Themes; those are distinct Questions with distinct ids.

**Cash (mode)**:
The default answer mode: free-text input, no clues shown. A correct Cash answer is worth 5 points. French UI label: « Cash ».

**Square (mode)**:
The fallback answer mode: 4 choices shown (the correct answer + 3 wrong ones); the player taps one. Entered by an explicit one-way switch from Cash (no going back, input value discarded, countdown keeps running). A correct Square answer is worth 2 points. French UI label: « Carré ».
_Avoid_: QCM, multiple choice

**Countdown**:
The 25-second timer per Question, anchored to wall-clock time. Starts when the Question is shown; never pauses or resets — not on mode switch, not when the app is backgrounded. On expiry it submits the current answer state.

**Canonical Answer**:
The single official correct answer of a Question — the form displayed on the results page.
_Avoid_: solution, right answer

**Alias**:
An alternate legitimate form of the Canonical Answer (synonym, abbreviation, digits vs words — « USA » for « États-Unis »). Not a typo. Curated per Question.
_Avoid_: variant, synonym list

**Misspelling**:
A pre-approved wrong spelling of the answer (« krisantème »), curated per Question (AI-proposed at authoring time), accepted only on exact match after normalization.
_Avoid_: typo list, fuzzy answer

**Answer Matching**:
The deterministic decision that a Cash answer is correct: after normalization, the input matches the Canonical Answer, an Alias or a Misspelling exactly, or falls within typo tolerance of the Canonical Answer or an Alias. Numbers never get tolerance. Runs on-device in practice and server-side in competition — the same deterministic rules, never AI.
_Avoid_: answer validation, AI check

**Answer (of the player)**:
Whatever stands at the moment of submission: the input text (Cash) or the selected choice (Square). Submission happens at Countdown expiry, or earlier if the player explicitly confirms. Empty or wrong answers score 0 — there is no partial credit and no penalty.

**Onboarding**:
The one-time welcome screen shown on a device's first launch — Mark over Wordmark, one « Commencer » button whose press accepts the legal terms and reveals the app. Never shown again on that device.
_Avoid_: welcome screen, splash (that's the loading gate)

**Mark**:
The Mentis starburst glyph, the brand's symbol. Rendered by `LogoMark`.
_Avoid_: logo (alone)

**Wordmark**:
The « mentis » lettering, rendered by `LogoWordmark`. Mark and Wordmark never form a fixed lockup; each surface composes them.
_Avoid_: logo (alone)
