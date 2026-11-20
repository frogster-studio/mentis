# How the Expo web export serves /<slug> and nothing else

Research for [#88](https://github.com/frogster-studio/mentis/issues/88), under the Theme Link map [#87](https://github.com/frogster-studio/mentis/issues/87). Throwaway branch, never merged.

Installed versions: `expo` 57.0.22, `expo-router` 57.0.21, `@expo/cli` 57.0.24 (root `node_modules`). The public Expo docs now describe SDK 58, so every SDK-57 claim below is checked against the installed source or a local export, not the docs alone.

## Answer

- **Ship a separate router root for the web build.** Point the `expo-router` plugin's `root` option at a small web-only route tree (a web `_layout.tsx`, `[slug].tsx`, and `+not-found.tsx`/`index.tsx` that send the visitor to the landing). Only that tree gets bundled. The native routes, the onboarding gate, `RootNavigator`'s syncs and sheets, Purchases and Supabase never reach the web bundle, and nothing in `src/app` is forked.
- **Keep `web.output: "static"`.** With that root it prerenders fine (verified), and it emits `[slug].html` as the shell for every slug. It also keeps per-slug HTML (`generateStaticParams`) open for the preview card ([#90](https://github.com/frogster-studio/mentis/issues/90)).
- **Vercel** rewrites `/:slug` to that shell. Everything else either redirects to the landing in `vercel.json` or reaches the app's `+not-found` route, which redirects. Unknown or unpublished slugs redirect client-side once `GET /app/themes` answers.
- **Cost:** `app.config.ts` needs a build-time switch to choose the root. This conflicts with the « `APP_VARIANT` is the only environment switch » rule, and the `root` option is documented as « Avoid using this property ».

## What the repo does today

- `app.config.ts` sets `web.output: "static"` with the bare `"expo-router"` plugin: no `asyncRoutes`, no `root`, no `sitemap` flag.
- The routes in `src/app` are `(tabs)/index` (home, with the onboarding gate `<Redirect href="/onboarding" />`), `(tabs)/world`, `picker/(tabs)/*`, `profile/(tabs)/*`, `onboarding/*`, `session/[themeId]`, `competition` and `leaderboard`. There are no `.web.tsx` or `.native.tsx` files.
- The root `_layout.tsx` returns `null` until fonts settle and the onboarding store has hydrated. It wraps `PersistQueryClientProvider` (an AsyncStorage persister) and `SheetProvider` around `RootNavigator`. `RootNavigator` runs `useOutboxSync()` and `useCompetitionSync()`, and mounts `TransferPrompt`, `PaywallSheet`, `SignInSheet` and `ToastHost`.
- `features/onboarding/store.ts` already hands the prerender an inert storage, because `typeof window === "undefined"` there.

### Local exports (2026-11-20, `bunx expo export -p web`, dev env, contracts built)

| Setup | Result |
| --- | --- |
| Current repo (`static`) | **Fails.** The Node prerender throws `Invariant Violation: __fbBatchedBridgeConfig is not set, cannot invoke native modules`. React Native's native `InitializeCore` path gets evaluated in the web SSR bundle. |
| Current repo with `output: "single"` | Works. One `index.html` plus one **5.6 MB** `entry` JS. |
| `single` + `asyncRoutes: { web: true }` | Works. One chunk per route, but `index.html` still loads a **4 MB** `__common` and a **1.1 MB** `entry` up front. |
| `src/app` + `_layout.web.tsx` + `[slug].tsx` / `[slug].web.tsx`, async routes | `single`: same 4 MB + 1.1 MB, and the native `_layout` and both `[slug]` files are still emitted as chunks. `static`: same prerender failure. |
| Separate root (`root: "src/web-probe"`: minimal `_layout` + `[slug]`), `single` | **1.6 MB** entry, 918 modules instead of 2,256. |
| Separate root, `static` | **Works.** Emits `[slug].html` (prerendered body), `+not-found.html` and `_sitemap.html`. |
| Separate root whose `_layout` is the real native `_layout.tsx` | `static` fails again, so the crash comes from the native root layout's import tree, not from Expo. |

The probe page imported nothing from the quiz, so the real Theme Link bundle will be bigger than 1.6 MB, by roughly the size of the play components. A stale `apps/mobile/dist` from 2026-08-19 (`expo-router` 57.0.12) shows that the static export did work back then, and that it wrote `session/[themeId].html` for the dynamic route.

## Output modes for a dynamic segment

- **static.** « Outputs a separate HTML file for every route in the `app` directory » ([publishing websites](https://docs.expo.dev/guides/publishing-websites/)). Without `generateStaticParams`, a dynamic route is written under its bracket name. `getHtmlFiles` maps `:slug` to `[slug]` and appends `.html` (`@expo/cli/build/src/export/exportStaticAsync.js`, `getHtmlFiles`). The host has to route `/foo` to that file itself, because the docs say dynamic paths without a generated file need extra configuration ([static rendering](https://docs.expo.dev/router/web/static-rendering/)). In the browser the router reads the real URL, so `useLocalSearchParams().slug` is `foo` after hydration. The prerendered markup was built with no slug, so the page's first paint must not depend on the slug, or React reports a hydration mismatch.
- **generateStaticParams.** In SDK 57 it runs in Node at build time and writes one HTML file per returned param. It also **keeps the generic route**: `loadStaticParamsRecursive` returns `[route, ...generatedRoutes]` (`@expo/router-server/build/loadStaticParamsAsync.js`). The result is `[slug].html` plus `quiz-histoire.html` and so on. A Theme published after the deploy still opens through the generic shell. Only its per-slug HTML (the head tags for #90) waits for the next build. Each param must be one non-empty segment with no `/` (`assertStaticParams`).
- **single.** One `index.html`, « no statically indexable HTML », and Vercel's documented rewrite `/:path*` → `/` ([publishing websites](https://docs.expo.dev/guides/publishing-websites/)). It is simplest and works today, but it rules out any per-slug HTML.
- **server.** Renders at request time behind a deployed server, which here means Vercel functions. Request-time rendering is the only output that can read a slug the build never saw ([static rendering](https://docs.expo.dev/router/web/static-rendering/)). Middleware and SSR are `unstable_` plugin flags in 57 (`expo-router/plugin/options.json`). It is too heavy for a route this small, unless #90 rules out build-time cards.

## Shipping only the Theme Link route

### Platform route files (`.web.tsx`): documented, but they don't exclude anything

- A platform file in `src/app` works « only if a non-platform version also exists », and `_layout.web.tsx` replaces `_layout.tsx` on web ([platform-specific modules](https://docs.expo.dev/router/advanced/platform-specific-modules/)). The source enforces this: `getMostSpecific` throws « does not have a fallback sibling file without a platform extension » (`expo-router/build/getRoutesCore.js`).
- So a web-only `/<slug>` needs `[slug].tsx` (native) next to `[slug].web.tsx`. On native that adds a root catch-all for single-segment paths. Static routes still win, and the file could later carry the universal link ([#93](https://github.com/frogster-studio/mentis/issues/93)).
- **Every native route stays a web route.** `getRoutesCore` only picks *which* file serves a route, and there is no user-facing ignore list. The web layout would have to guard every path and redirect each one away.
- **Nothing leaves the bundle.** The per-platform `require.context` regexes make the platform group optional (`expo-router/_ctx.web.js`, `_ctx.ios.js`), so every route file is bundled for every platform. The export confirmed it: the native `_layout` and both `[slug]` files ship on web, and `__common` stays at 4 MB.
- Static prerender would still render every native route, and that fails today until the native layout's culprit import is fixed.

### Separate router root: the only lever that really excludes code

- The plugin option `root` « Changes the routes directory from `app` to another value » and is marked « Avoid using this property » (`expo-router/plugin/options.json`). The CLI reads it from `exp.extra.router.root` for the whole project, rejects a path outside the project, and otherwise defaults to `src/app` (`@expo/cli/build/src/start/server/metro/router.js`, `getRouterDirectoryModuleIdWithManifest`). Metro then bundles only what that directory imports.
- It is per build, not per platform. `app.config.ts` would have to return `root: "src/<web-tree>"` only when building the Theme Link, and the plain `"expo-router"` entry otherwise. Native builds and the dev client never see it, and a full-app web build stays possible as a second build.
- The same switch can turn off `_sitemap.html` (plugin option `sitemap: false`).
- `src/app` is untouched. The web tree is about three route files that compose existing pieces (`ThemeReveal`, `PlayShell`, `SessionResults`, `usePlayLoop`, the quiz store). It cannot simply re-export `session/[themeId].tsx`. That page records the session (Device Stats or the outbox), its params are spread search params rather than a slug, and the Theme Link records nothing. The repo rule « a route file is the page itself » points the same way.
- Open questions for the grilling: how to express the switch given « `APP_VARIANT` is the only environment switch » (a third variant value or a dedicated build flag), and that `typedRoutes` types come from whichever root the dev server ran.

### Root layout providers and gates on web

Under the separate root, the web `_layout.tsx` decides what wraps the page. Here is what the current root layout does and what each piece means for the Theme Link:

- **Fonts.** `useFonts` returns `[true, null]` when there is no `window` (`expo-font/build/FontHooks.js`, `useStaticFonts`), so the prerender is not blocked. Keep it.
- **Onboarding hydration gate.** The zustand `persist` store hydrates asynchronously, so `hasHydrated` is still `false` during the synchronous Node render. The current root layout therefore prerenders `null` for every route. That would also swallow any `<Head>` tags a page renders, which matters for #90. The Theme Link has no onboarding, so drop the gate.
- **PersistQueryClientProvider.** It persists to AsyncStorage, which is localStorage on web. The map says nothing is recorded, so use a plain `QueryClientProvider`.
- **RootNavigator** (outbox and competition sync, TransferPrompt, Paywall, SignIn). All of it is account or native territory. Drop it, and keep only `ToastHost` (the desktop copy-link toast).
- **SheetProvider** (TrueSheet). No sheet is in scope on web. Drop it.

## Vercel

- **Rewrites lose to files:** « precedence is given to the filesystem prior to rewrites being applied ». Redirects « are always processed before rewrites ». `cleanUrls` serves `about.html` at `/about` ([vercel.json](https://vercel.com/docs/project-configuration/vercel-json)). So `_expo/*`, `assets/*` and the prerendered HTML files are served as-is, and a rewrite only catches what no file matches.
- **Shell rewrite:** `{ "source": "/:slug", "destination": "/[slug]" }` with `cleanUrls`. A literal bracket path in a destination is not documented and was not tested. If it fails, a post-export rename of `[slug].html` (or `single` with `/:slug` → `/`) does the same job. Settle it on a preview deploy ([#92](https://github.com/frogster-studio/mentis/issues/92)).
- **Everything else to the landing:** redirects run before rewrites, so a catch-all redirect would also swallow `/:slug`. Use one of two shapes:
  - explicit redirects (`/`, and any path with two or more segments) to the landing with `permanent: false`;
  - or let the web tree's `index` and `+not-found` routes call `window.location.replace(landing)` after boot.
  Unknown and unpublished slugs can only be detected client-side once `GET /app/themes` answers, so a client redirect exists either way.

## Sources

- Expo, Static rendering: https://docs.expo.dev/router/web/static-rendering/
- Expo, Publishing websites (output table, Vercel `vercel.json`): https://docs.expo.dev/guides/publishing-websites/
- Expo, Platform-specific modules: https://docs.expo.dev/router/advanced/platform-specific-modules/
- Expo, Async routes: https://docs.expo.dev/router/web/async-routes/ (SDK 58 page; in 57 they are off unless `asyncRoutes` is set, which the exports confirm)
- Vercel, vercel.json reference: https://vercel.com/docs/project-configuration/vercel-json
- Vercel, Rewrites: https://vercel.com/docs/rewrites; Redirects: https://vercel.com/docs/redirects
- Installed source: `expo-router/_ctx.web.js`, `_ctx.ios.js`, `plugin/options.json`, `build/getRoutesCore.js`; `@expo/router-server/build/loadStaticParamsAsync.js`; `@expo/cli/build/src/export/exportStaticAsync.js`, `build/src/start/server/metro/router.js`; `expo-font/build/FontHooks.js`
- Repo: `apps/mobile/app.config.ts`, `src/app/_layout.tsx`, `src/components/root-navigator.tsx`, `src/app/(tabs)/index.tsx`, `src/features/onboarding/store.ts`, `src/app/session/[themeId].tsx`
