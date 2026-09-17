<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Frogster Studio — the public site

`@mentis/web`, Next.js in static export: `bun run --filter @mentis/web build` emits `out/`, Vercel serves it. No server code, no env var, no database, no API call.

- Public pages are listed in `src/lib/routes.ts`; the root layout gives every one of them `SiteFooter`.
- Copy is French; slugs stay English because stores and reviewers read them in a URL.
- Design and comment rules are the back-office's ([apps/admin/AGENTS.md](../admin/AGENTS.md)): sky on a zinc base, one radius, 2–3 type sizes, Lexend titles / Poppins body. The Mentis mark is the app icon's own layers (`apps/mobile/assets/app-icon/`) imported as static assets, never a redrawn copy.
- Exception: `/mentis` follows the mobile onboarding artwork, with Epunda Slab Medium titles, Inter Tight Regular body, beige `#F5EBE2`, grid `#EEE4DB`, ink `#250313`, and the `#FFB15F` / `#FFE798` card gradient. Keep these styles scoped to the landing page.
- Use pill-shaped buttons for every Mentis landing-page CTA at all viewport sizes. ✅ `border-radius: 999px`; ❌ `border-radius: 20px`.
- The beta waitlist uses an embedded Tally form. No backend or secret is needed; see [README.md](README.md) for maintenance and data retention.
