# UI conventions

Cross-cutting design decisions. Honor these in every UI change; don't re-litigate them
per feature. Area-specific choices live in their issue, not here.
(Complements the design guidelines in AGENTS.md: sky accent on zinc, whitespace,
one radius, 2–3 type sizes, Lexend headings / Poppins body, lucide only.)

## Brand
- The yellow `#F7C400` is **brand-mark only** (logo spark, favicon). It is never a UI
  accent — no yellow buttons, links, rings, or highlights. Sky stays the only UI accent.
- The logo renders as a **two-tone lockup**: spark `#F7C400`, wordmark `currentColor`
  (foreground). Inline SVG component, not an `<img>`, so the wordmark follows the theme.

## App chrome
- The app header is a **sticky translucent bar**: `sticky top-0 z-40 bg-background/80
  backdrop-blur border-b`, `h-14`, viewport-wide with `px-6` gutters.
- Header layout is a 3-column grid (`grid-cols-[1fr_auto_1fr]`) — brand left, primary
  action dead-center, session actions right.
- Header-level icon buttons are **40px** (`size-10`); in-content icon buttons keep the
  shadcn defaults (`size-8`/`size-7`).

## Surfaces
- Pages use a **canvas + surface** model: canvas `bg-zinc-50`, content surfaces
  `bg-card border rounded-lg shadow-xs overflow-hidden`. No borderless full-bleed
  content on white.
- Page content is constrained to `max-w-7xl mx-auto`; only the header spans the viewport.
- One radius everywhere: `rounded-lg` (= `--radius`). Badges keep their pill shape.

## Buttons
- Icon-only buttons always carry `aria-label` **and** a tooltip (shadcn Tooltip,
  ~450 ms delay). Never a bare unlabeled glyph.
- **Tonal primary** recipe for icon-form primary actions: `bg-sky-100 text-sky-600` at
  rest → `hover:bg-primary hover:text-primary-foreground`. Same recipe as the
  posted-state social toggles — soft sky tint means "primary/active".
- Ghost icon buttons rest with `text-muted-foreground` and gain `bg-muted
  text-foreground` on hover.

## Data tables
- Header row is a **muted band**: `bg-zinc-50 border-b`, labels `text-xs font-medium
  text-muted-foreground`.
- Rows: white, hairline dividers (`border-b`, none on last), `hover:bg-muted/50`,
  `data-[state=selected]:bg-muted`. No zebra stripes, no vertical grid lines.
- Cells `py-2.5`; first and last columns `px-4` so content clears the surface edge.
