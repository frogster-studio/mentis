<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:design-rules -->
# Design guidelines

Every UI change must respect these. Whitespace and restraint over decoration.

- **Color:** one accent only — Tailwind **sky** — with its soft tints, on a **zinc** neutral base. No other accent colors.
- **Whitespace is a feature.** Give elements room to breathe; prefer generous spacing.
- **One corner radius** across cards, buttons, and icons — keep it consistent.
- **Type scale: 2–3 sizes max.** Don't sprawl to five.
- **Fonts:** self-hosted from `/public/fonts` — **Lexend Bold** (`/public/fonts/lexend-bold.ttf`) for titles/headings, **Poppins Regular** (`/public/fonts/poppins-regular.ttf`) for body text. Wire them up with `next/font/local`. If a font file you need is missing from `/public/fonts`, do **not** silently substitute another font — stop and surface a `⚠️` warning telling me exactly which file is missing so I can add it.
- **Icons:** `lucide-react` only. No other icon sets. One exception: the six Social brand marks (X, LinkedIn, Facebook, TikTok, YouTube, Instagram) are local `currentColor` SVG components in `src/components/social-icons.tsx` — lucide ships no brand icons.
- **Icon action buttons:** when an action reads clearly as a single icon (edit, delete, add, close…), render it as an icon-only ghost button — no label, no filled background. Use the shadcn `Button` with `variant="ghost"` and `size="icon"` (`src/components/ui/button.tsx`); the icon is transparent at rest and shows a subtle background only on hover. Reserve labelled/solid buttons for primary or ambiguous actions.
<!-- END:design-rules -->
