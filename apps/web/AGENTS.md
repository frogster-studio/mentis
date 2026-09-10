<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frogster Studio — the public site

`@mentis/web`, Next.js in static export: `bun run --filter @mentis/web build` emits `out/`, Vercel serves it. No server code, no env var, no database, no API call.

- The site is exactly the six pages of `src/lib/routes.ts`; the root layout gives every one of them `SiteFooter`.
- Copy is French; slugs stay English because stores and reviewers read them in a URL.
- Design and comment rules are the back-office's ([apps/admin/AGENTS.md](../admin/AGENTS.md)): sky on a zinc base, one radius, 2–3 type sizes, Lexend titles / Poppins body, brand art inline SVG in `currentColor`.
