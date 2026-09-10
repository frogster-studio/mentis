# PRD — Store submission readiness

Vocabulary: `apps/mobile/CONTEXT.md` (Player, Account, Premium, Pseudo, Onboarding, Mark). Rules: `AGENTS.md`, `apps/mobile/AGENTS.md`, `apps/admin/AGENTS.md` (design rules reused by the web site), `docs/agents/conventions.md`, `docs/adr/0006-premium-truth-is-mirrored-from-revenuecat.md`.

Goal: App Store Connect accepts « Add for Review » — Privacy Policy URL, Support URL, App Privacy, DAC7 — and the shipped build carries the in-app legal surfaces the review checks (guidelines 3.1.2 and 5.1.1).

## Decisions

### The studio web site

- A new workspace `apps/web`, package `@mentis/web`, Next.js in static export (`output: "export"`), no server code, no env var, no database, no API call. It joins `typecheck`, `test`, knip and Biome like every workspace; `check` stays the single proof.
- Fonts: Lexend Bold and Poppins Regular copied from `apps/admin/public/fonts` into `apps/web/public/fonts`, wired with `next/font/local`. Same design rules as the admin: zinc base, sky the only accent, one radius, two or three type sizes, generous whitespace. The Mark stays brand-mark only.
- Language: French only. Slugs in English because stores and reviewers look for them in a URL.
- Pages, and nothing else: `/` (studio), `/legal`, `/mentis/privacy`, `/mentis/terms`, `/mentis/support`. No `/mentis` page: the root is Mentis's showcase while the studio has one app.
- `/`: the studio name « Frogster Studio », one sentence, one Mentis card (Mark, name, one line, store badges marked « bientôt » until the store links exist), a footer linking `/legal`, `/mentis/privacy`, `/mentis/terms`, `/mentis/support`. Every page shares that footer.
- The publisher identity is hard-coded in one module (`src/lib/publisher.ts`): first name Hugo, last name Bayoud, sole trader (auto-entrepreneur — « Frogster Studio » is a trade name, not a legal entity), email `frogster.dev@gmail.com`, phone `06 98 35 28 92`, postal address `4 Place Duguesclin, 30000 Nîmes, France`, SIREN `94033623300017`. Publication director: Hugo Bayoud. The site is public, so the repo being public changes nothing.
- Host named on `/legal`: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States.
- Support address: `mentis@frogster-studio.com`, the single contact for support and for every GDPR request. It is an OVH redirect to `frogster.dev@gmail.com` (H2); the site never shows the Gmail address.
- `/mentis/support`: the support address as a `mailto:` link, then exactly four FAQ entries — supprimer mon compte (Compte → « Supprimer mon compte », immediate and irreversible, everything erased), gérer ou résilier l'abonnement (App Store or Google Play subscription settings, never in the app), restaurer un achat (« Restaurer mes achats » on the paywall, same store account), signaler une question erronée (email with the theme and the question).

### Legal texts (written by the agent in French, reviewed by Hugo in H4)

- Data inventory, the single source for the privacy policy, the App Privacy questionnaire and the iOS privacy manifest. Everything is linked to the Account, nothing is used for tracking, purpose « fonctionnement de l'app » only:
  - Email Address — the Apple or Google account email.
  - Name — the name the sign-in provider transmits; it seeds the default Pseudo.
  - User ID — the Supabase user id, also the RevenueCat app user id.
  - Device ID — one random UUID per installation, keying Stat Baselines; never a hardware identifier.
  - Purchase History — the Premium subscription, through RevenueCat.
  - Gameplay Content — Pseudo, scores, Quiz Session and Attempt results, the answers typed in competition.
- Anonymous play collects nothing: Device Stats never leave the device unless a Stats Transfer is accepted. No analytics, no crash reporting, no advertising SDK, no tracking.
- Processors named, with their role and region: Supabase (authentication and data, Frankfurt, EU), Railway (API, region `EU West (Amsterdam, Netherlands)`), Vercel (the web site), RevenueCat (subscription state, United States — transfer covered by the European Commission's standard contractual clauses), Apple and Google (sign-in and payment under their own policies). No data leaves the EU except to RevenueCat.
- Retention: Account data lives until the Account is deleted; deletion is immediate and cascades everything server-side; nothing is retained after. The public Leaderboard shows the Pseudo and Season Totals only, to signed-out Players too.
- Rights: access, rectification, erasure (in-app deletion or by email), portability, objection; complaint to the CNIL. Controller: Hugo Bayoud, contact `mentis@frogster-studio.com`.
- Age: anonymous play has no age condition; an Account requires 15 years or parental consent (French GDPR digital-consent age). Store age rating 4+. No age check in the app.
- Terms of use are Frogster Studio's own, never Apple's standard EULA, and they cover the subscription: « Mentis Premium », monthly, €2.99, no trial, auto-renewing at the same price unless cancelled at least 24 hours before the period ends, managed and cancelled in the store's subscription settings, refunds handled by Apple or Google under their rules, Premium features named as Replay and Catch-up. They also state: anonymous play, Account optional, one Pseudo per Account (unique, changeable, shown publicly on the Leaderboard), fair play (no automation), the right to close an Account that abuses the competition, French law, the support contact.
- Both documents carry a « Dernière mise à jour » date.

### Deployment

- A second Vercel project for `apps/web`, deployed by a `deploy-web` job in `.github/workflows/ci.yml` mirroring `deploy-admin`: its own `web-changed` path filter (`apps/web/`, `bun.lock`, `ci.yml`), its own concurrency group, the same `VERCEL_TOKEN` and `VERCEL_ORG_ID`, project id from `vars.VERCEL_WEB_PROJECT_ID`. The admin job and its filter are untouched.
- Domains: `frogster-studio.com` (apex) serves the site, `www` redirects to the apex. DNS stays at OVH (H5).

### Mobile — legal surfaces

- `src/lib/legal-links.ts` carries the three URLs (`https://frogster-studio.com/mentis/privacy`, `/mentis/terms`, `/mentis/support`) and stays import-free, so vitest's node environment can read it. `openExternalLink` (the in-app browser on native, `Linking.openURL` on web — today's `openLegal` in `legal-line.tsx`, moved) sits beside it in `src/lib/open-external-link.ts`: it needs `expo-web-browser`, which cannot load outside a native runtime. Feature copy stays in each feature's `constants.ts`.
- Onboarding: the sentence is unchanged; « Politique de confidentialité » opens the privacy URL, « Conditions d'utilisation » opens the terms URL. `LEGAL_URL` disappears.
- Paywall (guideline 3.1.2): under « Restaurer mes achats », a footer in `TEXT.caption`-class muted text: « Abonnement mensuel renouvelé automatiquement au même prix, sauf annulation au moins 24 h avant la fin de la période. Gérez ou résiliez à tout moment dans les réglages de l'App Store. » — « de Google Play » replaces « de l'App Store » on Android — then two links « Conditions d'utilisation » · « Politique de confidentialité ». The store name is chosen by a pure function of `"ios" | "android"`; the web never shows the paywall.
- Account screen (guideline 5.1.1): a footer of three quiet links — « Politique de confidentialité », « Conditions d'utilisation », « Support » — shown signed in and signed out, below the existing footer actions.
- Vouvoiement in the paywall footer like the rest of the paywall; the account footer is labels only.

### Mobile — avatar and manifest

- `ProfileAvatar` shows the Pseudo's first character, upper-cased, in an existing `TEXT` style (never a new token) when a Pseudo is loaded, and today's neutral dot otherwise. It takes `initial: string | null`; `AppHeader` derives it from `useProfile` through `profileInitial` in `src/components/profile-initial.ts` — its own import-free module, so the spec runs in vitest's node environment (item 7's lesson). `avatar_url` is no longer read anywhere; `https://picsum.photos` and `expo-image` leave the component. No network request is ever made for an avatar.
- `app.config.ts` declares `ios.privacyManifests`: `NSPrivacyTracking: false`, `NSPrivacyCollectedDataTypes` = the six inventory types (`NSPrivacyCollectedDataTypeEmailAddress`, `…Name`, `…UserID`, `…DeviceID`, `…PurchaseHistory`, `…GameplayContent`), each linked (`NSPrivacyCollectedDataTypeLinked: true`), not tracking (`…Tracking: false`), purpose `NSPrivacyCollectedDataTypePurposeAppFunctionality`. Accessed-API reasons stay Expo's defaults.

### Test seams

- Mobile: pure TS only, vitest — `src/lib/legal-links.test.ts` (the three URLs), the paywall store-name function, the avatar initial derivation; prior art `features/account/constants.test.ts`.
- Web: vitest on `src/lib/routes.ts` (the page list equals `/`, `/legal`, `/mentis/privacy`, `/mentis/terms`, `/mentis/support`) so the workspace's `test` script has a spec to run; `next build` emitting `out/` proves the static export.
- API: untouched, no new test.

### Out of scope

- Play Console Data safety form and store links on the site (after the Apple submission), English pages, a `/mentis` page, MDX or a CMS, analytics on the site, an age gate in the app, the review-account items already settled below.

### Store review access (settled earlier, kept for the human steps)

- One dedicated Google account is the review account for both stores: 2-Step Verification off, no phone, a recovery email owned by the studio, signed in once on a real device.
- The review account's email and password live in App Store Connect, Play Console and `.private/` alone — never in the repo, this file included.
- On iOS the reviewer may also use Sign in with Apple with their own Apple ID; on Android Google is the only sign-in.
- The review account is Premium through a promotional `premium` entitlement granted in RevenueCat for a dated year to that Account (never Lifetime — the mirror stores RevenueCat's `expires_at`, and a lifetime grant carries none) — the webhook lands in PRODUCTION, the mirror follows ADR 0006, no code involved.
- No hidden button, demo mode or review bypass exists in the app.
- The purchase itself is tested by the Apple reviewer with another Account (their own Apple ID), in the sandbox; the Play reviewer never purchases.
- The paywall lists only the Premium features that ship: Replay and Catch-up (done).
- Review notes (both stores, in English): Sign in with Apple accepts any Apple ID; Google uses the review account. The review account is already Premium; to test the subscription purchase, sign out and Continue with Apple with your own Apple ID. Path to the Premium features: open Compétition, play today's attempt, then Replay appears; Catch-up appears when yesterday has no attempt. The pseudo is born by itself.

## Items

```json
[
  {
    "category": "web",
    "description": "The apps/web workspace exists: @mentis/web, Next.js static export, the studio root page",
    "steps": [
      "bun run --filter @mentis/web build emits out/index.html; no env var is read anywhere in apps/web",
      "The root page renders « Frogster Studio », one sentence, one Mentis card with « bientôt » store badges, and a footer linking /legal, /mentis/privacy, /mentis/terms, /mentis/support",
      "Lexend Bold (titles) and Poppins Regular (body) are loaded with next/font/local from apps/web/public/fonts; the only accent is sky on a zinc base",
      "src/lib/routes.ts lists the five page paths and its vitest spec passes; knip.json carries an apps/web entry",
      "bun run check green from the repo root"
    ],
    "passes": true
  },
  {
    "category": "web",
    "description": "/legal carries the mentions légales",
    "steps": [
      "src/lib/publisher.ts holds the publisher identity from the Decisions (name, sole-trader status, address, phone, email, SIREN, publication director) and /legal renders every field",
      "/legal names the host: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States",
      "/legal is in the static export (out/legal.html or out/legal/index.html) and shares the site footer",
      "bun run check green from the repo root"
    ],
    "passes": true
  },
  {
    "category": "web",
    "description": "/mentis/privacy carries the privacy policy",
    "steps": [
      "The page names the controller (Hugo Bayoud, mentis@frogster-studio.com), the six inventory data types with their purpose, the fact that anonymous play collects nothing, the absence of analytics, crash and advertising SDKs",
      "The page names the six processors with role and region, states that only RevenueCat is outside the EU under standard contractual clauses",
      "The page states retention until Account deletion, the in-app deletion path, the five GDPR rights, the CNIL, the 15-year rule, and a « Dernière mise à jour » date",
      "The page is in the static export and shares the site footer; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "web",
    "description": "/mentis/terms carries the conditions d'utilisation, subscription included",
    "steps": [
      "The page covers anonymous play, the optional Account, the Pseudo rules and its public display, fair play, Account closure on abuse, French law, the support contact, and 15 years or parental consent",
      "A subscription section states: Mentis Premium, monthly, 2,99 €, no trial, auto-renewal at the same price unless cancelled 24 h before the period ends, management and cancellation in the store settings, refunds by Apple or Google, Replay and Catch-up as the Premium features",
      "The page carries a « Dernière mise à jour » date, is in the static export and shares the site footer; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "web",
    "description": "/mentis/support carries the support address and the FAQ",
    "steps": [
      "The page shows mentis@frogster-studio.com as a mailto: link and never the Gmail address",
      "Exactly four FAQ entries: supprimer mon compte, gérer ou résilier l'abonnement, restaurer un achat, signaler une question erronée — each answer matches the Decisions",
      "The page is in the static export and shares the site footer; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "ci",
    "description": "ci.yml deploys apps/web to its own Vercel project",
    "steps": [
      "A web-changed job filters on apps/web/, bun.lock and ci.yml; a deploy-web job needs check and web-changed, runs vercel pull/build/deploy with vars.VERCEL_WEB_PROJECT_ID under its own concurrency group",
      "The admin-changed and deploy-admin jobs are byte-identical to before",
      "The workflow parses: bunx yaml-lint or an equivalent YAML parse of .github/workflows/ci.yml succeeds; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The onboarding sentence opens two distinct legal pages through a shared links module",
    "steps": [
      "src/lib/legal-links.ts exports PRIVACY_URL, TERMS_URL, SUPPORT_URL under https://frogster-studio.com/mentis/ and its vitest spec asserts the three URLs; src/lib/open-external-link.ts exports openExternalLink",
      "In legal-line.tsx the privacy label opens PRIVACY_URL and the terms label opens TERMS_URL; LEGAL_URL and https://hugobayoud.fr no longer exist in apps/mobile",
      "bun run check green from the repo root"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The paywall shows the subscription terms and the two legal links",
    "steps": [
      "A pure function in the premium feature returns the footer sentence for \"ios\" (« …réglages de l'App Store ») and \"android\" (« …réglages de Google Play »), text per the Decisions; its vitest spec covers both",
      "paywall-sheet.tsx renders that sentence under « Restaurer mes achats », then « Conditions d'utilisation » and « Politique de confidentialité » opening TERMS_URL and PRIVACY_URL through openExternalLink",
      "Copy lives in the premium constants.ts, styles use TEXT and COLORS tokens only; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The account screen carries a legal footer",
    "steps": [
      "account-screen.tsx renders « Politique de confidentialité », « Conditions d'utilisation », « Support » as quiet links below the footer actions, in both the signed-in and signed-out states",
      "Each link opens its URL from src/lib/legal-links.ts; labels live in the account constants.ts and are covered by constants.test.ts",
      "bun run check green from the repo root"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The avatar shows the Pseudo's initial and makes no network request",
    "steps": [
      "ProfileAvatar takes initial: string | null; a string renders its upper-cased first character in an existing TEXT style, null renders the neutral dot",
      "AppHeader passes the initial derived from useProfile's pseudo through a pure function with a vitest spec (empty or missing pseudo gives null)",
      "grep finds no picsum.photos, no avatar_url and no expo-image import in profile-avatar.tsx; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "app.config.ts declares the iOS privacy manifest",
    "steps": [
      "ios.privacyManifests sets NSPrivacyTracking false and NSPrivacyCollectedDataTypes to exactly EmailAddress, Name, UserID, DeviceID, PurchaseHistory, GameplayContent — each linked, not tracking, purpose AppFunctionality",
      "cd apps/mobile && bunx expo config --type prebuild --json | grep -c NSPrivacyCollectedDataType prints a count consistent with six entries",
      "bun run check green from the repo root"
    ],
    "passes": true
  }
]
```

## Human steps

Each step carries its own proof; a step whose proof fails blocks the next one. Status: H1 done, H2 to H15 open.

The loop commits and pushes on branch `feat/store-readiness`, in its draft PR. Nothing deploys before that PR merges into `main`: the merge is the gate between the last item and the proof of H3.

### H1. Give the three missing facts — before item 2

- Postal address for the mentions légales, the SIREN, the Railway region of the API (Railway → service → Settings → Region).
- Replace `<ADRESSE — H1>`, `<SIREN — H1>` and `<REGION RAILWAY — H1>` in the Decisions above.
- Proof: no `— H1>` placeholder remains in the Decisions.

### H3. Vercel: the web project — before the PR merges

- New project on the same Vercel account, Root Directory `apps/web`, framework Next.js, no env var.
- GitHub → repository variables: `VERCEL_WEB_PROJECT_ID` = that project's id (`.vercel/project.json` after `vercel link`, or Project Settings → General).
- Proof: after the PR merges into `main`, the `deploy-web` job is green and the `*.vercel.app` preview shows the root page.

### H4. Review the legal texts — before H5

- Read `/legal`, `/mentis/privacy`, `/mentis/terms`, `/mentis/support` on the `*.vercel.app` URL; correct facts through a normal issue, never by hand on Vercel.
- Proof: every field of the publisher identity and every data type in the policy matches reality.

### H5. Domains: Vercel + OVH DNS

- Vercel project → Domains: add `frogster-studio.com` and `www.frogster-studio.com`, with `www` redirecting to the apex.
- OVH → zone DNS: replace the parking records — `A @ 76.76.21.21` (the value Vercel shows for the apex), `CNAME www cname.vercel-dns.com` (or the exact target Vercel shows). Remove the OVH « site en construction » hosting records.
- Why: Apple checks that the Privacy Policy URL and the Support URL resolve; a parking page is a rejection.
- Proof: `curl -sI https://frogster-studio.com/mentis/privacy` answers 200 and `https://www.frogster-studio.com` redirects to the apex.

### H6. New production build — after items 7 to 11

- `bunx eas-cli build --platform ios --profile production`, then upload to the 1.0.0 version in App Store Connect; select that build on the version page.
- Proof: on a TestFlight install, the onboarding links open two different pages, the paywall shows the footer, the Compte screen shows the three links, the header avatar shows the Pseudo's initial.

### H7. App Store Connect: URLs, App Privacy, age rating

- App Information: Privacy Policy URL `https://frogster-studio.com/mentis/privacy`; version page, French locale: Support URL `https://frogster-studio.com/mentis/support` (Marketing URL `https://frogster-studio.com` optional).
- App Privacy → Data Collection « Yes » → add exactly the six inventory types: Contact Info → Email Address; Contact Info → Name; Identifiers → User ID; Identifiers → Device ID; Purchases → Purchase History; User Content → Gameplay Content. For each: used for App Functionality, linked to the user's identity, not used for tracking. Publish.
- Age Rating questionnaire: none of the listed content → 4+.
- Proof: the version page no longer lists the Privacy Policy, App Privacy and Support URL errors.

### H8. App Store Connect: DAC7 and agreements

- Business → Agreements, Tax and Banking: the Paid Apps agreement active, banking and tax forms complete.
- Business → the DAC7 (Directive on Administrative Cooperation) compliance form: EU seller, sole trader, the SIREN, the postal address, VAT status (franchise en base if applicable).
- Why: a subscription cannot ship without the Paid Apps agreement, and DAC7 blocks « Add for Review » outright.
- Proof: the DAC7 line disappears from the « Unable to Add for Review » box.

### H9. Create the review Google account

- Create a personal Google account (never a Workspace user) and skip the phone number at creation.
- 2-Step Verification off, no phone on the account, recovery email = a studio address.
- Sign in once on a real device and clear whatever verification Google asks for there, so the reviewer's sign-in is not the account's first.
- Write the address, the password and the recovery email in `.private/` — never in the repo.
- Why: the reviewer signs in from an unknown network on a device the account has never seen; a 2SV prompt, a phone challenge or a fresh-account block reads as « we could not sign in » and is an instant rejection.
- Proof: a private browser window signs the account in with the password alone, no challenge.

### H10. Google Cloud + Supabase

- OAuth consent screen (the project holding the Mentis clients) → publishing status « In production ». In « Testing » only listed test users may sign in, and the review account is not one.
- Credentials → an Android OAuth client for `com.frogsterstudio.mentis` carrying the **Play App Signing** SHA-1 (Play Console → Test and release → Setup → App signing), beside the existing EAS-keystore client. Google re-signs the build the reviewer installs, so only that fingerprint matches.
- Supabase → Authentication → Providers → Google: `Authorized Client IDs` lists the Web and the iOS client ids — the audience Supabase trusts. Android carries no id there: it matches by package + SHA-1.
- Proof: on a build installed from a Play track, « Continuer avec Google » signs the review account in. Code 10 means the fingerprint does not match — compare `apksigner` on the downloaded APK against the console before touching anything else.

### H11. Sign in once with the review account

- Install the production variant (`com.frogsterstudio.mentis`, TestFlight or the Play internal track), sign in with the review account, let onboarding run until the pseudo exists.
- Why: the Account and the RevenueCat customer are born from this sign-in — `appUserID` is the Supabase user id, so nothing can be granted before it exists.
- Copy the account's UUID from Supabase → Authentication → Users into `.private/`: it is the RevenueCat App User ID of H12.
- Proof: RevenueCat → Customers, searching that UUID, returns a customer.

### H12. RevenueCat: webhook, then the grant

- Integrations → Webhooks: URL `<Railway API URL>/revenuecat/webhook`, the `Authorization` header set to the API's `REVENUECAT_WEBHOOK_AUTH` value, environment « Sandbox and Production ».
- That customer → Grant entitlement → `premium`, duration **Yearly**, never Lifetime: the mirror stores RevenueCat's `expires_at` and the server gate is `premium_until > now()`, so a lifetime grant lands a null row and every Replay or Catch-up answers `PREMIUM_REQUIRED`.
- « Compte Premium » in the app is read from the SDK, not from the mirror: it will show Premium either way and proves nothing.
- Proof: on the device, Compétition → play today's attempt → Replay actually starts (`GET /app/me/premium` answering `active: true` says the same). If it refuses, stop: the webhook never landed — read the Railway logs and the customer's event history — and no client action can force a resync.

### H13. App Store Connect: sandbox purchase and review information

- Users and Access → Sandbox → Test Accounts: one studio tester, never the review account.
- On a device running the production variant, set that tester in Settings → Developer → Sandbox Apple Account, then buy the monthly product from the paywall. It proves the store product, the paywall and the activation loop before the reviewer meets them.
- The submitted version lists the monthly subscription in its « In-App Purchases and Subscriptions » section: a first subscription is reviewed with the build, and an unattached one is simply never reviewed.
- App Review Information: « Sign-in required » checked, the review account's email and password, and the *Review notes* above, in English.
- Proof: the sandbox purchase flips that Account to Premium, and the version shows the subscription attached.

### H14. Play Console

- App content → App access → « All or some functionality is restricted »: one instruction set carrying the review account's credentials and the path — open Compétition, play today's attempt, Replay appears; Catch-up appears when yesterday holds no attempt.
- Say that Google is the only sign-in on Android and that the pseudo is created by the app itself, so the reviewer never looks for a registration form.
- App content → Privacy policy: `https://frogster-studio.com/mentis/privacy`.
- Proof: App access saves without warning, and a build installed from a Play track signs in with those exact credentials.

### H15. Keep the backends up for the whole review

- The Railway API stays deployed, never sleeping, on the same public URL — the RevenueCat webhook and the shipped build both point at it.
- The Supabase project stays unpaused and its keys unrotated until the review ends; the same holds for `REVENUECAT_WEBHOOK_AUTH` and the REST key.
- Why: nothing works offline — a reviewer facing a dead API sees an app that cannot start a competition, which is rejected as broken.
- Proof: `GET <API URL>/health` answers, checked the day of submission and again on any « In Review » notification.
