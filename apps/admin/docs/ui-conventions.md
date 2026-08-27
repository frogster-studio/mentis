# UI conventions

Cross-cutting design decisions. Honor these in every UI change; don't re-litigate them
per feature. Area-specific choices live in their issue, not here.
(Complements the design guidelines in AGENTS.md: sky accent on zinc, brand rules,
whitespace, one radius, 2–3 type sizes, Lexend headings / Poppins body.)

## App chrome
- The app header is a **sticky translucent bar**: `sticky top-0 z-40 bg-white/80
  backdrop-blur border-b`, `h-14`, viewport-wide with `px-6` gutters.
- Header layout is a 3-column grid (`grid-cols-[1fr_auto_1fr]`) — brand left, primary
  action dead-center, session actions right.
- Header-level icon buttons are **40px** (`size-10`).

## Surfaces
- Pages use a **canvas + surface** model: canvas `bg-zinc-50`, content surfaces
  white with `border rounded-lg shadow-xs overflow-hidden`. No borderless full-bleed
  content on white.
- Page content is constrained to `max-w-7xl mx-auto`; only the header spans the viewport.
- One radius everywhere: `rounded-lg`. Badges keep their pill shape.

## Buttons
- Icon-only buttons always carry `aria-label` **and** a tooltip. Never a bare
  unlabeled glyph.
- **Tonal primary** recipe for icon-form primary actions: `bg-sky-100 text-sky-600` at
  rest → solid sky on hover. Soft sky tint means "primary/active".
- Ghost icon buttons rest muted (`text-zinc-500`) and gain a subtle background on hover.

## Data tables
- Header row is a **muted band**: `bg-zinc-50 border-b`, labels `text-xs font-medium
  text-zinc-500`.
- Rows: white, hairline dividers (`border-b`, none on last), subtle hover tint. No zebra
  stripes, no vertical grid lines.
- Cells `py-2.5`; first and last columns `px-4` so content clears the surface edge.
