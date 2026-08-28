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
- Two page shapes. A **workspace** (the curation dashboard) is full-bleed: no page
  padding, columns run edge to edge and floor to ceiling under the header, fused into
  one white plane divided by `divide-x divide-zinc-200` hairlines — no per-column
  border, radius or shadow. A **focused page** (login) centers its content on the
  `bg-zinc-50` canvas as a white `border rounded-lg shadow-xs` surface.
- Workspace column widths are fixed multiples of the narrowest column, with the last
  column taking the remainder (`minmax`); below their sum the workspace scrolls
  horizontally rather than squeezing.
- One radius everywhere: `rounded-lg`. Badges keep their pill shape.

## Buttons
- Icon-only buttons always carry `aria-label` **and** a tooltip. Never a bare
  unlabeled glyph. The tooltip is the native `title` attribute — no custom component.
- A column's create action is a **`+` icon button in its header band**, inline SVG in
  `currentColor`, never a text link.
- **Tonal primary** recipe for icon-form primary actions: `bg-sky-100 text-sky-600` at
  rest → solid sky on hover. Soft sky tint means "primary/active".
- Ghost icon buttons rest muted (`text-zinc-500`) and gain a subtle background on hover.

## Data tables
- Header row is a **muted band**: `bg-zinc-50 border-b`, labels `text-xs font-medium
  text-zinc-500`.
- Rows: white, hairline dividers (`border-b`, none on last), subtle hover tint. No zebra
  stripes, no vertical grid lines.
- Cells `py-2.5`; first and last columns `px-4` so content clears the surface edge.
