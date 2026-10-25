# PRD — The Compétition tab loads without a spinner

Vocabulary: [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) (Player, Account, Pseudo, Attempt, Replay, Catch-up, Competition Day, Season, Leaderboard, Standing, Streak, Theme, Category). Rules: [AGENTS.md](AGENTS.md), [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md), [docs/agents/conventions.md](docs/agents/conventions.md).

## Decisions

### Scope

- Only the Compétition tab and the shared header (avatar, points pill) change. Every other screen keeps `ScreenLoading` / `ScreenError` until [#77](https://github.com/frogster-studio/mentis/issues/77) migrates it.
- The tab's reads still wait for its first visit: no prefetch at launch.

### Last-known data

- The persister keeps, beside the account reads it already keeps: the Competition Day, the Standing, the Leaderboard pages of the current Season, and the transcripts of the cached Day's Attempts. Nothing else from the competition persists: Attempt issuance stays in memory, other Seasons' pages and older transcripts are dropped.
- Persisted reads survive a session that never visits the tab: the query client must not garbage-collect them after the default 5 minutes.
- Usable data renders on the first frame and is re-read silently under the existing stale rules. A background re-read never shows a skeleton.
- A Day counts only on its own Europe/Paris date; a Standing or a Leaderboard page only in its own Season (Europe/Paris month). Anything else is treated as no data and re-read. The check runs at render, on persisted and in-memory data alike.
- At Paris midnight with the tab on screen, the Day is re-read (and the Standing and pages on a Season change); the daily card shows its skeleton shell meanwhile.
- Stale values on screen for the instant of a re-read (yesterday's rank or points) are accepted.

### Skeleton

- One shared `Skeleton` primitive: a Squircle block sized as the content it stands for, so the expected state resolves without a layout shift.
- Opacity pulse of about 1 s per phase; every skeleton on screen runs on one shared clock and breathes in unison.
- Tint is the surface's ink with a hex alpha: `COLORS.ink` on light surfaces, `COLORS.face` on dark ones (bordeau). No new hex.
- Static under the OS reduce-motion setting, and when frozen.
- Content replaces a skeleton instantly: no fade, no delay, no minimum duration.
- Bundled images never get a skeleton; only reads and downloaded images do.

### Leaderboard preview and points pill

- No usable data: three rows, each fully skeleton (rank, pseudo, points), the Player's pseudo not shown, the medal shown.
- Resolved: today's placement logic is unchanged — the Player in the middle, on top when n° 1, at the bottom when last, absent (top 3) when unranked this Season.
- The header points pill: from usable Standing at once; a skeleton under the pseudo without it; nothing when signed out.
- Signed out: the page 1 preview as today, persisted like any page.

### Daily card

- A usable Day renders its state at once: « À jouer », « Faite » with Replay, « Faite » without Replay.
- Signed in with no usable Day: the orange daily frame and the real Streak badge; the title, teaser, « ? » tile and CTA label are skeletons at the « À jouer » sizes; the CTA face stays, its label a skeleton bar, not pressable. A resolve to « Faite » switches the card to green: accepted.
- « Faite » without a usable transcript (played on another device, first launch): the score shows at once; the theme-image layer and the category badge are skeletons, never the generic landscape swapped for the Theme's image.
- Signed out: « À jouer » at once, as today.
- The state is never guessed: no CTA is shown that a resolve could replace.

### Rattrapage card

- Rendered only once a usable Day says `catchup`. No placeholder, skeleton or spinner before; its content (local countdown, bundled image) is unchanged.

### Load failures

- A read with no usable data pulses through the client's retries, then its skeletons freeze.
- One toast per failure, however many reads failed together: « Impossible de charger la compétition. Touche une carte pour réessayer. », icon `cloud-off-outline`, bottom-center. The toast keeps no action button.
- Retry: the next foreground or tab focus re-reads (existing behaviour), and a tap on a frozen card re-reads that card's reads — the frozen preview re-reads instead of opening the Leaderboard.
- A failed re-read under usable data shows nothing: no toast, no freeze.

### Header avatar

- A bordered Squircle replaces the circle, on both tabs.
- Signed in with an `avatar_url` in the session (Google): a skeleton in the avatar's shape until the photo decodes, then the photo; later launches read it from the disk cache. The URL needs no request.
- No `avatar_url` (Apple, signed out) or a failed download: the initial; no pseudo either: the neutral dot, as today.
- The Profile screen's portrait is unchanged.

### Bundled images

- The tab's four PNGs — flame, landscape, play-again-landscape, question-mark — move to the originals and ship as the WebP `bun run images` generates; every use points at the WebP (Streak badge, stat tile, card background, Rattrapage card, daily card).

### Rules

- `apps/mobile/AGENTS.md`: the feedback-states rule names the `Skeleton`, the frozen state and the one toast, keeping `ScreenLoading` / `ScreenError` only for screens #77 has not migrated; the animation rule admits the Skeleton pulse beside the press mechanic; the data-access paragraph names what the persister keeps and the Paris day / Season rule. Compact lines, mechanics stay here.
- No glossary term, no ADR.

### Test seams

- Pure freshness guards with an injected `now`: the Day ↔ Paris date check across 23:59:59 → 00:00:00 Paris and both DST switches, the Season check across a month boundary (prior art: `streak.test.ts`, `season-calendar.test.ts`, `catchup-deadline.test.ts`).
- The persist predicate as a pure function over query keys and data (prior art: `chunked-storage.test.ts` for `lib/`).
- No component rendering tests (house rule): UI items end with `bun run check` green and their screen states listed as steps, reviewed on device by the human.

### Out of scope

- « Réalisée par », the two bars under « C'est sérieux là ! », the « Compète du jour » title, the history icon on the Rattrapage CTA.
- Every other screen's loading ([#77](https://github.com/frogster-studio/mentis/issues/77)), the Profile portrait, prefetching the tab.
- A toast action button, pull-to-refresh.
- Any API, contract or schema change.

## Items

```json
[
  {
    "category": "mobile",
    "description": "A cached Competition Day counts only on its own Paris date, a cached Standing or Leaderboard page only in its own Season",
    "steps": [
      "Pure guard, injected now: a Day dated today in Europe/Paris is usable, yesterday's is not, across 23:59:59 → 00:00:00 Paris and both DST switches",
      "Pure guard: a Standing or Leaderboard page whose season is the current Europe/Paris month is usable, last month's is not, across the month boundary at Paris midnight",
      "The tab's Day, Standing and Leaderboard preview reads treat unusable data as no data and re-read it, persisted or in memory",
      "With the tab on screen, Paris midnight re-reads the Day, and the Standing and pages on a Season change",
      "vitest pure spec (prior art: streak.test.ts, season-calendar.test.ts)"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The persister keeps the Compétition tab's reads across launches",
    "steps": [
      "Pure persist predicate: keeps successful account queries (unchanged), the Day, the Standing, current-Season Leaderboard pages and the transcripts of the cached Day's Attempts",
      "It drops Attempt issuance, other Seasons' pages and any transcript whose Attempt is not in the cached Day",
      "Persisted queries are not garbage-collected while the app runs without visiting the tab",
      "apps/mobile AGENTS.md data-access paragraph names what the persister keeps and the Paris date / Season rule",
      "vitest pure spec over the predicate; bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "A shared Skeleton primitive, and the rules that replace ScreenLoading where the layout is known",
    "steps": [
      "Skeleton is a Squircle block pulsing opacity about 1 s per phase, every instance on one shared clock",
      "Its tint is COLORS.ink with a hex alpha on light surfaces, COLORS.face with a hex alpha on dark ones; no new hex",
      "Static under the OS reduce-motion setting, and when frozen",
      "apps/mobile AGENTS.md: the feedback-states rule names Skeleton, the frozen state and the one toast, ScreenLoading/ScreenError kept only for screens #77 has not migrated; the animation rule admits the Skeleton pulse",
      "bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The leaderboard preview and the header points pill render last-known data at once, skeletons without it",
    "steps": [
      "Usable Standing and pages: preview and pill on the first frame, no skeleton, re-read silently",
      "No usable data: three fully skeleton rows (rank, pseudo, points), no pseudo shown, the medal shown; the pill is a skeleton under the pseudo",
      "Resolved: placement unchanged — middle, top when n° 1, bottom when last, top 3 without the Player when unranked",
      "Failed with no usable data: skeletons frozen; a tap on the frozen preview re-reads instead of opening the Leaderboard",
      "Signed out: page 1 preview, no pill; no ScreenLoading or ScreenError left in the section",
      "bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The daily card renders its known state at once or its orange skeleton shell, and the Rattrapage card appears once the Day says so",
    "steps": [
      "Usable Day: « À jouer », « Faite » with Replay or « Faite » without Replay on the first frame",
      "Signed in, no usable Day: orange daily frame, real Streak badge; title, teaser, « ? » tile and CTA label skeletons at the « À jouer » sizes; the CTA face stays, not pressable",
      "« Faite » without a usable transcript: the score at once; the theme-image layer and the category badge are skeletons, never the generic landscape",
      "Failed with no usable data: frozen; a tap on the card re-reads its Day and transcript",
      "Paris midnight with the tab open: back to the skeleton shell until the new Day lands",
      "Rattrapage rendered only once a usable Day says catchup, nothing in its place before; signed out: « À jouer » at once",
      "No ScreenLoading or ScreenError left on the tab; bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "A read that fails with nothing on screen raises one toast, however many cards failed",
    "steps": [
      "After the client's retries, a read with no usable data freezes its skeletons and shows « Impossible de charger la compétition. Touche une carte pour réessayer. » with cloud-off-outline, bottom-center",
      "Day, Standing and Leaderboard failing together raise one toast, not three",
      "A failed re-read under usable data: no toast, no freeze",
      "The next foreground or tab focus re-reads the frozen reads",
      "Copy in the competition constants; bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The header avatar is a bordered Squircle showing the Google photo, a skeleton until it first decodes",
    "steps": [
      "A bordered Squircle replaces the circle on both tabs",
      "Session with avatar_url: skeleton in the avatar's shape until the photo decodes, then the photo, read from the disk cache on later launches",
      "No avatar_url (Apple, signed out) or a failed download: the initial; no pseudo either: the neutral dot",
      "The Profile screen's portrait is unchanged; bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The tab's four bundled PNGs ship as WebP",
    "steps": [
      "flame, landscape, play-again-landscape and question-mark live under assets/originals/competition/ and bun run images generates their WebP",
      "Every use points at the WebP: Streak badge, stat tile, card background, Rattrapage card, daily card",
      "No PNG left under assets/images/competition/; bun run check green"
    ],
    "passes": false
  }
]
```

## Human steps

- Before the loop: nothing — no migration, no dashboard SQL, no API deploy.
- After the last item, on iOS and Android: a cached cold launch (no skeleton), a reinstall (skeletons), an airplane-mode cold launch (frozen skeletons, one toast, a tap re-reads), Paris midnight with the tab open, reduce motion on, an Apple Account (initial) and a Google Account (photo). Then merge.
