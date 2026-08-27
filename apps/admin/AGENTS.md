<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:design-rules -->
# Design guidelines

Every UI change must respect these. Whitespace and restraint over decoration.

- **Color:** one accent only — Tailwind **sky** — with its soft tints, on a **zinc** neutral base. No other accent colors.
- **Brand:** the orange `#F59E0B` is **brand-mark only** (the favicon). Never a UI accent — no orange buttons, links, rings, or highlights.
- **Brand art is inline SVG**, never an `<img>`: `LogoWordmark` (`src/components/logo-wordmark.tsx`) renders in `currentColor` so the lettering follows the theme.
- **Whitespace is a feature.** Give elements room to breathe; prefer generous spacing.
- **One corner radius** across cards, buttons, and icons — keep it consistent.
- **Type scale: 2–3 sizes max.** Don't sprawl to five.
- **Fonts:** self-hosted from `/public/fonts` — **Lexend Bold** (`/public/fonts/lexend-bold.ttf`) for titles/headings, **Poppins Regular** (`/public/fonts/poppins-regular.ttf`) for body text. Wire them up with `next/font/local`. If a font file you need is missing from `/public/fonts`, do **not** silently substitute another font — stop and surface a `⚠️` warning telling me exactly which file is missing so I can add it.
<!-- END:design-rules -->

<!-- BEGIN:comment-rules -->
# Comments

Follow the repo rule ([docs/agents/conventions.md](../../docs/agents/conventions.md)): none by default — prefer a longer, precise name; business-logic "why" only; one short sentence max, never multi-line, file headers included.
<!-- END:comment-rules -->
