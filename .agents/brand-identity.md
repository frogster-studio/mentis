# Mentis — Visual Identity Brief

Brand: **Mentis** (Latin — "of the mind"). A French-market general-knowledge brand: a consumer quiz app (core product), a weekly anecdote podcast, and an editorial back-office for the Card library. Grounded in [brand-context.md](brand-context.md).

Audience: French-speaking digital natives (roughly 18–35) who scroll and consume passively today, but light up when knowledge is served well. Positioning: modern, fun, accessible — mass, not niche. The opposite of dusty trivia. Candidate tagline: _"Le cerveau aussi a besoin d'un bon feed."_

---

## 01 — Identity Strategy Statement

Mentis makes culture générale feel like a modern consumer product, not a school subject. The identity should carry the energy of the smart friend at a dinner party — the one who drops "did you know Louis XIX reigned for 20 minutes?" and has the whole table leaning in. Every visual decision should signal _play with substance_: bright, confident, and snackable on the surface, genuinely well-crafted underneath. We are building the anti-Trivial-Pursuit — nothing dusty, nothing academic, nothing that smells like a classroom.

---

## 02 — Logo Direction

**Primary direction** — A custom lowercase wordmark: `mentis`. The name is short, sonorous, and Latin — it carries the "mind" credibility on its own, so the mark doesn't need to explain the category. Pair it with a small detachable symbol: a **spark** (a 4-point star / asterisk shape) that can dot the "i" or live alone as the app icon and podcast avatar. The spark is the moment an anecdote lands — the "ohh!" made visible.

**Character** — Confident and warm. It should feel like a media brand (something you'd see on a podcast chart) rather than an edtech tool.

**Style notes** — Geometric construction with rounded terminals; medium-to-bold weight; tight but breathable kerning. Constructed, not hand-drawn — the playfulness comes from the spark and the color, not from wobbly letterforms.

**What to avoid** — The trivia graveyard: question marks as the mark, lightbulbs, brains, owls, graduation caps, laurel wreaths, serif "heritage" typography. No gradients-on-gradients tech-startup blur. Nothing that could sit on a pub-quiz flyer.

**3 logo references**

1. **Duolingo** — borrow the rounded, friendly wordmark confidence that makes learning read as play without becoming childish.
2. **Headspace** — borrow how one trivially simple shape (their dot) becomes the entire brand; our spark should work that hard.
3. **Konbini** — borrow the bold French pop-media energy; Mentis should feel like it belongs next to French youth media, not next to encyclopedia publishers.

---

## 03 — Color Palette

Anchored on the palettes already chosen in the product (Tailwind `SKY` + `ZINC`), extended with one accent.

**Primary — Mentis Sky**
`#0EA5E9` (Tailwind sky-500). A bright, optimistic, digital-native blue. Blue says "knowledge/trust", but this blue is daylight, not navy — intelligence without the corporate suit or the academic gown.

**Secondary colors**

- **Ink** — `#18181B` (zinc-900): all long-form text and dark surfaces. Near-black, softer than pure black.
- **Cloud** — `#F4F4F5` (zinc-100): default light background; keeps cards airy.
- **Spark Amber** — `#F59E0B` (amber-500): the accent. Reserved for the payoff moments — correct answers, streaks, the "did you know" reveal, the spark in the logo.

**Color personality** — A clear morning: sky blue + white space + one warm flash of amber. Curious, awake, generous. Emotionally closer to a weather app than a library.

**Usage rules** — Sky owns brand surfaces and interactive elements; Ink owns reading. Amber is rationed: never more than ~10% of a screen, never for body text, never amber-on-sky (fails contrast and vibrates). White/Cloud should dominate — the brand breathes.

**Palette type** — Complementary (blue/orange axis) on a neutral zinc base.

---

## 04 — Typography

**Primary typeface — Lexend** (free, Google Fonts; Lexend Bold already lives in `public/fonts/`). Lexend was literally designed to improve reading proficiency — a typeface engineered to make reading easier is the perfect origin story for a brand whose mission is feeding brains. Geometric, open, friendly at bold weights, effortless at text sizes.

**Secondary typeface — Inter** (free, Google Fonts) for dense UI: the back-office, tables, labels, settings. It disappears politely where Lexend performs.

**Type personality** — Clear, modern, a little rounded — spoken French rather than written French. Headlines should sound like the podcast: direct address, first person, contractions welcome.

**Usage hierarchy**

- Headlines: Lexend Bold, tight leading, sentence case (never ALL CAPS lectures)
- Subheads: Lexend Medium
- Body / card text: Lexend Regular, 1.5–1.6 line height, generous measure
- Labels / UI chrome: Inter Medium, small sizes

**Avoid** — Serifs (instant academia), condensed "game show" display faces, script fonts, and anything with a Latin-inscription vibe. The name is Latin; the type must not be.

---

## 05 — Imagery & Photography Style

**Overall aesthetic** — "Archival, remixed." Much of the content is historical or factual (Louis XIX, Pierre Mendès France, wedding dresses, coconuts), so archival and documentary images are raw material — but they get a modern treatment: clean crops, bold framing on Sky or Cloud backgrounds, generous margins. The past presented like fresh news.

**Subject matter** — The subject of the fact itself: the object, the person, the place. Specific beats generic — an actual coconut, not a metaphor for danger. No decorative "concept" imagery.

**Color treatment** — Natural color, slightly lifted brightness and contrast so historical images sit comfortably next to the bright palette. A duotone Sky treatment (image knocked to sky-blue monochrome) is the house style for social cards and podcast episode art when source images are inconsistent.

**What to avoid** — Sepia-and-parchment "history channel" framing, stock photos of people pointing at lightbulbs or holding chins in thought, over-produced 3D illustration packs, dark-academia moodboards.

---

## 06 — Iconography & Illustration

**Style** — Rounded line icons; the product already uses **lucide** — keep it as the system set. Custom icons (Card Types: Quiz, True/False, Anecdote, Did You Know, Riddle) must be drawn on the lucide grid so they're indistinguishable from the system set.

**Weight** — Regular (2px stroke at 24px), matching lucide defaults.

**Personality** — Functional and quiet in the UI; expression is concentrated in the one branded glyph — the spark — which may appear filled (Amber) as the single expressive icon in the system.

---

## 07 — Design Principles

**Lead with the hook.**
Every surface opens with the question or the fact, never with chrome or branding. The content is the hero; the brand is the stage lighting.

**Playful, never childish.**
Humor lives in the words and the amber spark — not in wacky fonts, mascots, or confetti. If a screen would embarrass a 30-year-old showing a friend, it's off-brand.

**One spark per screen.**
Restraint is the polish. One accent moment, one bold headline, lots of air. Snackable means light, not loud.

**Feed, don't lecture.**
Short lines, big type, one idea at a time. If a layout starts looking like a textbook page or a slide of bullet points, break it into cards.

---

## 08 — Brand Expressions

**Social media (the shareable Card)** — The core brand asset: a question card template (Sky or Cloud background, Lexend Bold question, spark logo bottom-corner) and its matching reveal card. Designed so a screenshot of the app IS the ad. Instagram/TikTok formats first: 1080×1350 and 1080×1920.

**Podcast** — Cover art: `mentis` wordmark + spark on Sky, no photo (must survive at 176px in podcast apps). Episode art variant: duotone archival image of the week's best anecdote subject with an episode number in Lexend Bold.

**App** — App icon is the spark alone on Sky. In-product: Cloud backgrounds, white cards, Sky interactive elements, Amber strictly for reveals/streaks. Correct/incorrect feedback uses Amber/Ink, not the clichéd green/red slot-machine flash.

**Back-office (this repo)** — The utilitarian sibling: zinc-dominant, Sky for primary actions, shadcn/ui components as-is. On-brand through typography (Lexend headings) and the spark in the header — not through decoration; editors need density and speed.

**Presentations / pitch decks** — Cloud background, Lexend Bold statements set huge (one idea per slide, like a Card), duotone archival images, spark as the bullet glyph. The deck should feel like scrolling the app.

---

_Related: [brand-context.md](brand-context.md) · next steps: brand-voice (verbal identity), brand-guidelines (full standards doc)_
