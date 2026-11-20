# What a universal link to the installed app would cost

Ticket: [#93](https://github.com/frogster-studio/mentis/issues/93), map [#87](https://github.com/frogster-studio/mentis/issues/87). Researched 2026-11-20 against Expo SDK 57 (`apps/mobile/package.json`: `expo ~57.0.22`, `expo-router ~57.0.21`); the Expo docs online are v58, and nothing quoted here changed between the two.

## Answer

**Small. Go.** Six pieces, about one route file and three config lines of code. The real cost is one EAS production build plus one App Store review, and verifying it on a real device after the AASA file is live.

| # | Piece | Where | Size |
|---|---|---|---|
| 1 | `apple-app-site-association` file | `apps/mobile/public/.well-known/` (copied into the web export) | ~15 lines JSON |
| 2 | Hosting: serve it with a 200 and `application/json`, no redirect, out of the catch-all redirect | the Vercel config of the web build (#92) | 2 rules |
| 3 | `ios.associatedDomains` | `apps/mobile/app.config.ts` | 1 line |
| 4 | Native route for `/<slug>` that resolves the slug and opens the practice session | `apps/mobile/src/app/` (shares the `[slug]` route #88 adds for web) | 1 file |
| 5 | Onboarding check on that route | same file | a few lines |
| 6 | New iOS binary: EAS production build, submit, App Store review | `bunx eas-cli build/submit` | 1 release cycle |

Prerequisite shared with the whole Theme Link, not specific to this ticket: `appThemeSchema` in `packages/contracts/src/app/theme.ts` has no `slug` field today (the `themes` table has one, see `apps/api/src/_database/entities/theme.entity.ts`). #88 needs it to resolve the slug on web; the native route reuses it.

## 1. The apple-app-site-association file

Apple's rules ([Supporting associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)):

- Named `apple-app-site-association`, **without an extension**, at `https://<fully qualified domain>/.well-known/apple-app-site-association`.
- "You must host the file using https:// with a valid certificate and with no redirects."
- Each app is identified as `<Application Identifier Prefix>.<Bundle Identifier>`. "The apps in the apple-app-site-association file on your website must have a matching com.apple.developer.associated-domains entitlement."
- `components` is an ordered array of URL patterns (`/`, `?`, `#`, `exclude`, `comment`).

Expo adds: for Expo Router, put the file in `public/.well-known/`; the uncompressed file must stay under 128 KB; `*` does not match `/` or `.` ([Expo: iOS universal links](https://docs.expo.dev/linking/ios-universal-links/)).

Shape for Mentis (Team ID left as a placeholder; it is public by nature, since every AASA file publishes it):

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["<TEAM_ID>.com.frogsterstudio.mentis", "<TEAM_ID>.com.frogsterstudio.mentis.dev"],
        "components": [
          { "/": "/.well-known/*", "exclude": true },
          { "/": "/*", "comment": "A single-segment path is a Theme Link slug." }
        ]
      }
    ]
  }
}
```

`/*` opens the app for every slug, including unknown ones. The app handles those the same way the web does: it sends the Player home (piece 4). That keeps the pattern stable, which matters because of caching (see Risks). The production and dev bundle ids both come from `app.config.ts` (`APP_VARIANT`). Listing the dev id lets the dev client be tested against the real domain.

## 2. Hosting on jouer.frogster-studio.com

- **The file sits in the web export.** `apps/mobile/public/` is copied verbatim into the static export. The export served at `jouer.frogster-studio.com` (#88/#92) therefore serves it with no new project.
- **The catch-all redirect must skip it.** The map says any URL other than a valid Theme Link redirects to `frogster-studio.com/mentis`. A redirect on `/.well-known/apple-app-site-association` breaks universal links outright. TN3155 says a 301 or 302 "is not supported when hosting the AASA file". The redirect rule (or the client redirect in the web `[slug]` route) must leave `/.well-known/*` alone. Vercel serves a static file before it evaluates rewrites, but an explicit `redirects` source pattern would still catch it. Exclude it in the pattern.
- **Content type: set it explicitly.** Apple's current pages state no content-type requirement. The file has no extension, so a static host has no extension to infer the type from. Add a Vercel `headers` entry setting `Content-Type: application/json` for that path. It costs one rule and removes a failure mode.
- **Reachability.** The domain must be "available to all IP addresses and ranges, does not redirect, and is not blocked by access policies" ([TN3155: Debugging universal links](https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links)). A Vercel preview protection or password must never sit on this domain.

## 3. `associatedDomains` and EAS-managed provisioning

- Config: `ios.associatedDomains: ["applinks:jouer.frogster-studio.com"]`. Entries follow `applinks:<fully qualified domain>[:port number]`, with no protocol ([Expo app config](https://docs.expo.dev/versions/latest/config/app/)). It goes on both variants, because the AASA lists both bundle ids.
- Prebuild (CNG) writes it into `com.apple.developer.associated-domains` in the generated entitlements. `ios/` stays gitignored and untouched, as `apps/mobile/AGENTS.md` requires.
- **Capability sync is automatic.** On `eas build`, EAS "automatically synchronizes capabilities". If the entitlement is present, it enables Associated Domains on the App ID in the Apple Developer Console ([EAS: iOS capabilities](https://docs.expo.dev/build-reference/ios-capabilities/)). No manual Developer Console step, no signing plugin, no credential env var. It stays inside the "EAS managed credentials only" rule.
- **Provisioning profile.** Enabling a capability invalidates existing profiles for that bundle id. Expo's page says manual changes require regenerating them. Neither the capabilities page nor [managed credentials](https://docs.expo.dev/app-signing/managed-credentials/) says when EAS regenerates a profile automatically. Expect EAS to report the stored profile as no longer valid and regenerate it on an interactive `eas build`; if it does not, `bunx eas-cli credentials` regenerates it. This step is **unverified**: check it on the first build, not before.
- The dev client (`com.frogsterstudio.mentis.dev`) built locally with `expo run:ios` gets the same entitlement through Xcode automatic signing for development.

## 4. The app route that receives `/<slug>`

How Expo Router handles the link: "Expo Router assumes an incoming URL targets a page in the app" ([native intent](https://docs.expo.dev/router/advanced/native-intent/)). A universal link to `https://jouer.frogster-studio.com/les-simpson` is matched against `src/app/` like any path. A root dynamic route `[slug].tsx` receives `{ slug: "les-simpson" }` through `useLocalSearchParams` ([URL parameters](https://docs.expo.dev/router/reference/url-parameters/)). Static routes (`/competition`, `/leaderboard`, `/onboarding`, `/picker`, `/profile`, `/session/...`) take precedence, so they keep working.

**It is the same route file as the web Theme Link.** `src/app/` is shared by the web export and the native app. Whatever route #88 adds for `/<slug>` on web also matches on native, so the native behaviour must be decided either way. A route file may be split by platform, "only if a non-platform version also exists" ([platform-specific modules](https://docs.expo.dev/router/advanced/platform-specific-modules/)). That allows `[slug].web.tsx` (the web play) next to `[slug].tsx` (native).

What the native `[slug].tsx` does:

1. Read the catalog through the existing themes query (`GET /app/themes`, already cached at `LONG_STALE_TIME_MS`), and find the Theme whose `slug` matches.
2. **Found:** `router.replace` to `/session/[themeId]` with the same params `PickerStartButton` (`src/components/quiz/picker-start-button.tsx`) pushes today: `themeId`, `name`, `imageUrl` and the five `category*` fields. The session route stays untouched, and the Theme Reveal plays from there.
3. **Unknown slug or unpublished Theme:** `router.replace("/")`, the native counterpart of the web redirect to the landing.
4. While the catalog loads, show the same loading state the session route uses.

On quit, the session's `goHome` calls `router.dismissTo("/")`. Home is not in the history after a cold-start link, so check on device that quitting still lands on home. Expo Router's `anchor` setting is the documented way to keep a default screen under a deep-linked one ([router settings](https://docs.expo.dev/router/advanced/router-settings/)). That is optional here.

**Rejected alternative: rewriting in `+native-intent.tsx`.** `redirectSystemPath({ path, initial })` can rewrite `/<slug>` before routing. But it "runs outside your app's context", so it has no query cache and no stores, and it would need its own fetch to resolve the slug. A route file is simpler and reuses the cached catalog.

## 5. The onboarding gate

The gate lives only on home: `src/app/(tabs)/index.tsx` redirects to `/onboarding` while `hasOnboarded` is false. A link that opens `/<slug>` directly never passes through home. It would skip the onboarding, where « C'est parti » records the legal acceptance (`src/features/onboarding/store.ts`). So the native `[slug].tsx` checks `useOnboardingStore((s) => s.hasOnboarded)` first, and redirects to `/onboarding` when it is false. The root layout already waits for the store to hydrate before it renders anything, so the flag is known by then.

Only one Player hits this case: someone who installed the app, never finished onboarding, and then tapped a Theme Link. A fresh install from the App Store opens from the store's « Ouvrir », not from the link, because iOS has no deferred deep linking. Dropping the Theme and running the onboarding is enough. Carrying the slug through the onboarding is not worth its cost.

## 6. App absent, and the App Store release

- **App absent.** Without the app, iOS opens the URL in the browser like any link. The fallback is the Theme Link web play itself, with no code.
- **New build and review: yes.** The entitlement is part of the signed binary. Expo says changes to `associatedDomains` require a native build. The app is live on the App Store (`apps/web/src/features/mentis/store-links.ts`), so this takes one `bunx eas-cli build --platform ios --profile production` + `submit`, then App Store review. The project has no `expo-updates`, so an over-the-air update is not an option anyway, and over-the-air updates cannot change entitlements in any case. Nothing about Associated Domains is a special review topic. It rides the next normal release.
- **Ordering.** The AASA must be live on `jouer.frogster-studio.com` before the build reaches users. iOS downloads the file at install or update time and rarely re-reads it afterwards.

## Risks

1. **Social in-app browsers may never hand off.** Theme Links are made for social networks. TN3155: "It is up to third-party web browsers to enable universal links functionality". In-app browsers of social apps decide for themselves whether to open the app. Links tapped in Messages, Mail, Notes, or in Safari coming from another domain do open the app. The share of real taps that open the app is unknown until it is measured, and could be low on exactly the channel the Theme Link targets.
2. **Caching makes AASA mistakes slow to fix.** "Devices check for updates approximately once per week after app installation". The only way to force a fresh copy is "reinstall the app. There is no direct CDN invalidation option" (TN3155). Ship `/*` once and leave it.
3. **The catch-all redirect can silently kill it.** If the redirect to the landing catches `/.well-known/…`, links stop opening the app, and nothing in the web play shows that anything is wrong. Verify with `curl -I` (expect a 200 and no `Location` header) and with `sudo swcutil dl -d jouer.frogster-studio.com` on a Mac (TN3155).
4. **Measurement blind spot.** A tap that opens the app skips the web play, so none of the four web measures fires for it. The Theme Link analytics undercount real engagement among Players who already have the app.
5. **Typed URLs never open the app.** "Entering the URL directly into the web browser's address bar will never open the app" (TN3155). A same-domain navigation stays in the browser too. This is expected behaviour, not a bug to chase.
6. **Profile regeneration is undocumented.** See section 3. At worst it costs one `eas credentials` run on the first build.

## Side note: Android App Links (Android is not released)

The equivalent is `android.intentFilters` with `autoVerify: true` on `https://jouer.frogster-studio.com/*` ([Expo app config](https://docs.expo.dev/versions/latest/config/app/)), plus `/.well-known/assetlinks.json` on the same domain. That file must list the SHA-256 of **both** signers: the EAS upload keystore for sideloaded builds and Play App Signing for Play installs, the same two-signer split Google sign-in already needed. The native route (piece 4) is shared. Do it when Android ships, not now.
