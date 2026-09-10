# PRD — Account deletion URL

Vocabulary: `apps/mobile/CONTEXT.md` (Account, Premium, Pseudo). Rules: `AGENTS.md`, `apps/web/AGENTS.md`, `apps/mobile/AGENTS.md`, `docs/agents/conventions.md`.

Goal: Play Console's « Delete account URL » field accepts a page of the studio site, and the in-app deletion keeps satisfying App Store guideline 5.1.1(v). Runs after `PRD.md` — `apps/web` and its five pages must exist first.

## Decisions

### What the stores actually require

- Google Play needs a public HTTPS URL, reachable without signing in, landing **directly** on the deletion page — a home page with a buried link is the first cause of rejection. The page must name the app and the developer as the store listing shows them, spell out the steps, and say what is deleted, what is kept and for how long. It does **not** have to perform the deletion: Google accepts a support email or a request form.
- Apple has no such field. Guideline 5.1.1(v) demands that deletion **start inside the app**, which already ships (`DELETE /app/me/account`); a web-only or `mailto:`-only flow is a rejection. So the page is Play's, and the app never links to it.
- Deletion is already immediate and total: `supabase.auth.admin.deleteUser` cascades every table hung on `auth.users` — profile, quiz sessions, stat baselines, competition attempts and answers, standings, premium mirror — so the Leaderboard row goes with it.

### The page

- One dedicated page, `/mentis/delete-account`, added to `src/lib/routes.ts`. It stays **out of `SiteFooter`**: the four legal links are enough on every page, and Google wants the URL to land on the deletion page itself.
- It names « Mentis » and « Frogster Studio » as the Play listing shows them, and states in one sentence that deletion is immediate and irreversible.
- Two ways, in this order. **Depuis l'application** (the normal one): open Mentis, press the menu button at the top right of the header, screen « Compte », « Supprimer mon compte », confirm « Supprimer ». **Par email** (the fallback for a Player who no longer has the app): write to `mentis@frogster-studio.com` **from the Account's own email address** — that address is the identity check, which Google permits — with a ready-made template; answer and deletion within 30 days, in practice a few days.
- The template, verbatim:
  - Subject: « Demande de suppression de mon compte Mentis »
  - Body: « Bonjour, » / « Je demande la suppression définitive de mon compte Mentis et de toutes les données associées. » / « - Email du compte : … » / « - Pseudo : … » / « - Méthode de connexion : Google / Apple / Je ne sais plus » / « Merci de me confirmer la suppression une fois effectuée. »
- What is erased: the Account, the Pseudo, the scores, the Quiz Sessions, the competition Attempts and their answers, the Leaderboard standings, the Premium mirror — everything, with no retention period. What survives, outside the studio's reach: the purchase record held by Apple, Google and RevenueCat.
- The store subscription is not cancelled by the deletion. The page says so plainly and tells the Player to cancel it in the store's subscription settings **before** deleting the Account.
- Copy is French, the slug English, like every page of the site.

### Interaction

- One client component, `src/components/copy-button.tsx` — the site's first `"use client"` — used twice: the support address and the email template. It writes through `navigator.clipboard`, shows « Copié » for two seconds, then goes back.
- It is a convenience, never the only path: the address is also a `mailto:` link and the template is displayed in full and selectable, so a browser with no clipboard API loses nothing.

### Entry points

- `/mentis/support`, FAQ entry « Comment supprimer mon compte ? »: a link to `/mentis/delete-account`.
- `/mentis/privacy`, on the erasure right: the same link.
- `apps/web/AGENTS.md` says « the five pages »; it becomes six.

### The in-app confirmation

- Apple asks that a Player with an active subscription be told the billing continues through the store. `DELETE_ACCOUNT_MESSAGE` becomes a pure function of `isPremium`: unchanged when false, plus a sentence on the subscription surviving and where to cancel it when true. `account-screen.tsx` already holds `isPremium` from `useIsPremium()`.

### Test seams

- Web: vitest on pure TS only — `src/lib/routes.test.ts` (six pages) and a spec on the new content module (the template's subject and body, the `mailto:` encoding, the in-app steps). Prior art: `src/lib/routes.test.ts`. The page and the copy button are proven by `next build` emitting the route and by grep, never by a DOM test — the workspace has no jsdom and gains none.
- Mobile: `features/account/constants.test.ts` covers both branches of the message function.

### Out of scope

- Revoking Sign in with Apple tokens on deletion (its own GitHub issue): it needs a `.p8` key, a signed `client_secret` JWT and Apple's refresh token, which Supabase does not hand over.
- A self-service web deletion — no public unauthenticated route is added to the API.
- Deleting part of the data without deleting the Account: nothing in the app offers it, and Play's Data safety question is answered « No ».
- English pages, a deletion page for a future app, any change to `SiteFooter`.

## Items

```json
[
  {
    "category": "web",
    "description": "/mentis/delete-account exists and carries both deletion paths",
    "steps": [
      "src/lib/routes.ts gains deleteAccount: \"/mentis/delete-account\" and routes.test.ts asserts the six page paths",
      "A pure module src/lib/delete-account.ts holds the in-app steps, the email subject and body from the Decisions and a mailto builder; its vitest spec asserts the subject, the three template fields and the encoded mailto",
      "src/components/copy-button.tsx is the site's only \"use client\" component: it copies its text, shows « Copié » for two seconds, and the copied text stays visible and selectable beside it",
      "The page names Mentis and Frogster Studio, states the deletion is immediate and irreversible, lists what is erased, names the purchase record kept by Apple, Google and RevenueCat, and tells the Player to cancel the subscription in the store before deleting",
      "bun run --filter @mentis/web build emits the route in out/; apps/web/AGENTS.md says six pages; bun run check green from the repo root"
    ],
    "passes": true
  },
  {
    "category": "web",
    "description": "The support FAQ and the privacy policy link to the deletion page",
    "steps": [
      "The « Comment supprimer mon compte ? » FAQ entry of /mentis/support links to ROUTES.deleteAccount",
      "/mentis/privacy links to ROUTES.deleteAccount where it states the erasure right",
      "SiteFooter still carries exactly its four links; bun run check green from the repo root"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The in-app deletion confirmation warns a Premium Player about the subscription",
    "steps": [
      "A pure function in features/account/constants.ts takes isPremium and returns today's message when false, and the same message plus the subscription sentence (billing continues through the store, cancel it in the store settings) when true",
      "account-screen.tsx feeds it the isPremium it already reads from useIsPremium(); DELETE_ACCOUNT_MESSAGE is no longer used as a bare constant",
      "constants.test.ts covers both branches; bun run check green from the repo root"
    ],
    "passes": false
  }
]
```

## Human steps

### H16. Play Console: the Data safety deletion answers — after `PRD.md` H5

- App content → Data safety → the account-creation section: « Delete account URL » = `https://frogster-studio.com/mentis/delete-account`.
- « Do you provide a way for users to request that some or all of their data is deleted, without requiring them to delete their account? » → **No**.
- Why H5 first: Google fetches the URL, and a domain still parked at OVH answers with a page that is not the deletion page.
- Proof: `curl -sI https://frogster-studio.com/mentis/delete-account` answers 200, and the Data safety form saves with no error on the field.
