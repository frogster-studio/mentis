# How each Theme Link gets its own social preview card

Research for [#90](https://github.com/frogster-studio/mentis/issues/90), part of the Theme Link map [#87](https://github.com/frogster-studio/mentis/issues/87). Throwaway branch, never merged. Sources checked 2026-11-20 against the installed Expo SDK 57 (`expo-router` 57.0.21, `@expo/router-server` 57.0.9).

## Answer

- **Every crawler reads the tags from the raw HTML, without JavaScript.** So the `<meta>` tags must already be in the file served for `/<slug>`. Rendering them client-side with react-query will not work.
- **Recommended: build-time pre-rendering in Expo itself.** Use `generateStaticParams` on the Theme Link route plus `<Head>`. SDK 57 static export writes `<Head>` tags into each page's HTML. That gives one HTML file per Published Theme, with no server and no Vercel function.
- **The cost is a rebuild when a Theme is published.** Vercel Deploy Hooks are unavailable here because they need the Git integration, which the Hobby plan refuses for this repo. A GitHub Actions workflow does the rebuild instead. Run it on a daily `schedule`, with `workflow_dispatch` for manual runs and optionally `repository_dispatch` from the API on publish.
- **A new Theme still plays before the next rebuild.** Until then it gets the generic Mentis card, because the app resolves the slug at runtime anyway. Unpublishing is harmless too: the stale page loads, then redirects.
- **Do not use the Theme image as-is for `og:image`.** It is a portrait 750 × 1024 WebP. Every large-card layout is landscape (≈1.91:1 or 2:1), Meta lists no WebP type, and Apple asks for ≥ 900 px width. Generate a 1200 × 630 JPEG per Theme at build time. `sharp` is already a devDependency of `apps/mobile`. Put a content hash in its filename so Meta's per-URL image cache never serves a replaced picture.

## The constraint every option must meet

| Consumer | Runs JS? | What it reads | Source |
|---|---|---|---|
| iMessage (Messages) | **No.** "Link previews do not follow meta redirects, nor run JavaScript; metadata must be available directly on the linked page." It follows server-side redirects. | `og:title`, `og:image`, `og:site_name`, icon | [Apple TN3156](https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages) |
| WhatsApp | Not stated. WhatsApp sends an HTTP GET "on behalf of the sender" and needs the `<head>` within the first 300 KB of HTML, so it parses raw HTML. | `og:title`, `og:description`, `og:url` (required, non-empty) and `og:image` | [WhatsApp link previews](https://developers.facebook.com/documentation/business-messaging/whatsapp/link-previews/) |
| Facebook | Not stated on the page. Without OG tags, the crawler falls back to "internal heuristics". | `og:url`, `og:title`, `og:description`, `og:image` | [Meta webmasters](https://developers.facebook.com/docs/sharing/webmasters/) |
| X | Not reachable (see the note below) | `twitter:card` + og fallback | see the note |
| Instagram | No first-party doc found for link previews in DMs | — | — |

Apple also says to "serve the same metadata to both mobile and desktop versions". In other words, do not gate the tags on the crawler's User-Agent.

**Note on X.** `developer.x.com/en/docs/x-for-websites/cards/*` now 307-redirects to the `docs.x.com` overview. The cards pages are absent from `docs.x.com/llms-full.txt`. The figures below come from the last published version, as indexed by search engines. They are lower confidence: 2:1 aspect, min 300 × 157, max 4096 × 4096, under 5 MB, and JPG/PNG/WEBP/GIF accepted.

## Options compared

### A. Build-time pre-rendering in Expo (recommended)

How it works in the installed SDK 57:

- `web.output` is already `"static"` (`apps/mobile/app.config.ts`).
- In a dynamic route, `generateStaticParams()` is "a server-only function evaluated at build-time in a Node.js environment by Expo CLI". It returns one `{ slug }` per page to emit ([static rendering](https://docs.expo.dev/router/web/static-rendering/)). It can `fetch` the public `GET /app/themes`.
- **`<Head>` tags reach the static HTML in SDK 57.** `@expo/router-server/build/static/renderStaticContent.js` renders the tree inside `Head.Provider`. Its `mixHeadComponentsWithStaticResults` then injects the helmet tags straight after `<head>`. That puts them in the earliest bytes, well within WhatsApp's 300 KB window. The current docs say `<Head>` tags are "not included in the initial static HTML". That line describes SDK 58+, which moved to `generateMetadata()`. The same page says "only SDK 57 and earlier use `<Head>`" for static metadata. In 57, `generateMetadata` is resolved only on the streaming-SSR path (`MetroBundlerDevServer.js`, `renderStreamingContent.js`), never during static export.
- `<Head>` renders synchronously, so the Theme's name and card URL must be known while the page renders. There are two ways to provide them:
  1. **Data loader.** Set `unstable_useServerDataLoaders` in the `expo-router` plugin (SDK 55–57; stable in 58). Then a route `loader(request, params)` runs at export for each path. `exportStaticAsync.js` calls `executeLoaderAsync` for each pathname and passes the data into the render, so `useLoaderData()` feeds `<Head>`. "Data is determined at build-time and does not change until the next build" ([data loaders](https://docs.expo.dev/router/web/data-loaders/)).
  2. **No flag.** A build script writes `{ slug → name, card }` to a JSON file that the route imports. This is simpler, but it adds a generated artifact.
- `+html.tsx` (`src/app/+html.tsx`, absent today) holds the tags shared by every page: `og:site_name`, `og:type`, `twitter:card`, the icon.

Pros: zero runtime, no function, nothing between the visitor and the CDN. It also fits "the web build serves only the Theme Link".

Cons: the card is only as fresh as the last build. The API must be reachable from the build, which is already true: `GET /app/themes` is public and throttled per IP.

### B. Vercel Routing Middleware injecting the tags

[Routing Middleware](https://vercel.com/docs/routing-middleware) works on all plans and with non-Next projects, through `vercel.json` `proxy.entrypoint` or `middleware.ts`. It "runs globally before the cache". It can rewrite, redirect or return its own `Response`, and it is billed as Fluid compute. A tag injector would:

1. Match `/:slug`.
2. Fetch the Theme from the API, cached.
3. Self-fetch the static shell and string-replace the `<head>`. Vercel documents this self-fetch pattern for [CSP nonces on cached HTML](https://vercel.com/kb/guide/csp-nonces-with-cdn-cache).
4. Return the result.

Pros: a newly published Theme gets its card instantly, with no rebuild.

Cons:
- One function invocation and one Railway round-trip per page view, humans included, because Apple says not to UA-gate.
- Theme Link latency starts to depend on the API.
- A function appears in a deploy that is otherwise static.
- Hand-rolled HTML patching.

A Vercel Function behind a rewrite has the same profile.

### C. Expo server rendering (`web.output: "server"`)

Server rendering is stable only in SDK 58. In 55–57 it sits behind `unstable_useServerRendering` and "requires a deployed server" ([server rendering](https://docs.expo.dev/router/web/server-rendering/)). The output can't mix static and server rendering. On Vercel it runs through the third-party `expo-server/adapter/vercel`, which is "subject to breaking changes" ([API routes](https://docs.expo.dev/router/web/api-routes/)).

Request-time `generateMetadata` would give per-Theme tags with no rebuild. But it means running the whole Theme Link as SSR on an unstable flag, with a per-request render. Not worth it for one set of tags. Revisit after the SDK 58 upgrade if instant cards ever matter.

## Rebuild / refresh when a Theme is published

- **Vercel Deploy Hooks are unavailable.** Creating one requires the project to be "connected to a Git repository" ([deploy hooks](https://vercel.com/docs/deploy-hooks)). The Hobby plan's Git integration cannot see this org repo, which is why `ci.yml` deploys admin and site with `vercel deploy --prebuilt`.
- **GitHub Actions is the trigger** ([events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)):
  - `schedule`: a daily cron is enough. Note that "scheduled workflows are automatically disabled when no repository activity has occurred in 60 days" on public repos. The daily-question bot's commits count as activity.
  - `workflow_dispatch`: Hugo rebuilds by hand after a publish.
  - `repository_dispatch`: `CurationService.stageTheme` with `published: true` would POST an event, so the card exists within minutes. This needs a new GitHub token in the API's env.
- **Graceful gap.** The route also emits its generic shell (a dynamic route not covered by `generateStaticParams`). The hosting rewrite can serve that shell for unknown slugs with the generic Mentis card. The app still resolves the slug at runtime through `GET /app/themes`, so a Theme published after the last build plays at once and only lacks its own card. An unpublished Theme's stale page loads and the app redirects to the landing. Wiring that rewrite belongs to the hosting ticket.
- **Crawler caches.** Meta: "images are cached based on the URL and won't be updated unless the URL changes". Re-scraping is done through the Sharing Debugger. ADR 0007 already gives each uploaded Theme image a fresh path. A generated card must follow suit, so use `og/<slug>-<hash>.jpg`, not `og/<slug>.jpg`. No doc found states X, WhatsApp or Apple cache durations.

## Images: platform constraints vs Theme images today

**Theme images today** (ADR 0007, `theme.entity.ts`, `catalog/utils/theme-image-url.ts`):
- The DB stores a bucket path. The API composes a public `${SUPABASE_URL}/storage/v1/object/public/theme-images/<path>`, served as `imageUrl` by `GET /app/themes`.
- New uploads must be WebP, exactly **750 × 1024 (portrait, ≈0.73:1)**, at most 200 KB, not animated.
- Legacy images can be any ratio up to 2 MiB.
- A Theme with no upload uses `default.webp`.

**Gaps in the public contract:**
- `appThemeSchema` (`packages/contracts/src/app/theme.ts`) carries `id`, `name`, `imageUrl`, `questionCount` and `category`, but **no `slug`**. The slug exists on `ThemeEntity` (unique). It must join the contract for the build, and for the runtime slug resolution #87 already assumes.

| Platform | Documented constraint | Theme image as-is |
|---|---|---|
| Facebook | min 200 × 200; ≥ 600 × 315 for the large layout; 1200 × 630 recommended; "as close to 1.91:1 as possible"; ≤ 8 MB; `og:image:type` listed as jpeg/gif/png; set `og:image:width`/`height` so the first share renders ([images](https://developers.facebook.com/docs/sharing/webmasters/images/), [webmasters](https://developers.facebook.com/docs/sharing/webmasters/)) | Size OK, portrait gets cropped, WebP not among the listed types |
| WhatsApp | width ≥ 300 px, aspect ≤ 4:1, < 600 KB; format unspecified; missing these "may risk the link to be not previewed" | New images pass; legacy images over 600 KB fail |
| iMessage | width ≥ 900 px; < 150 px may become an icon; HTML ≤ 1 MB, linked resources ≤ 10 MB; "avoid text in preview images", title via `og:title`, brand via `og:site_name`; square icon ≥ 108 px | 750 px is below the 900 px guideline |
| X (lower confidence) | `summary_large_image` 2:1, 300 × 157 to 4096 × 4096, < 5 MB, WEBP accepted | Portrait gets cropped |
| OG protocol | `og:title`, `og:type`, `og:image`, `og:url` required; `og:image:alt` should accompany the image ([ogp.me](https://ogp.me/)) | — |

**Recommendation: one 1200 × 630 JPEG card per Theme, generated during the web build.**
- Composition: the Theme image centred on a brand background (beige `#F5EBE2`).
- Size: well under 600 KB, which satisfies all of the table above.
- Hosting: serve it from the Theme Link domain under a hashed name, with `og:image:width`/`height`/`alt` set.
- Text: keep it off the image (Apple's guidance). The Theme name goes in `og:title`, "Mentis" in `og:site_name`.
- ADR 0007 is untouched: the API still never sees image bytes, and the build reads the public CDN URL.
- `apps/mobile` already ships `sharp` and `scripts/optimize-images.ts`.
- Fallback if generation is dropped: use the Theme `imageUrl` as-is. It previews on WhatsApp and iMessage, but gets cropped and stays small elsewhere.

## Not verified

- X cache behaviour and whether a card validator still exists.
- How Instagram DMs preview links: no first-party doc.
- Whether WhatsApp accepts WebP: its doc names no format.
- The exact file Expo emits for an uncovered dynamic route, and the Vercel rewrite that serves it: that belongs to the hosting ticket.
