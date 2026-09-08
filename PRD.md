# PRD — Store review access

Vocabulary: `apps/mobile/CONTEXT.md` (Player, Account, Premium, Replay, Catch-up). Rules: `AGENTS.md`, `apps/mobile/AGENTS.md`, `docs/adr/0006-premium-truth-is-mirrored-from-revenuecat.md`.

## Decisions

### Review account

- One dedicated Google account is the review account for both stores: 2-Step Verification off, no phone, a recovery email owned by the studio, signed in once on a real device.
- The review account's email and password live in App Store Connect, Play Console and `.private/` alone — never in the repo, this file included.
- On iOS the reviewer may also use Sign in with Apple with their own Apple ID; on Android Google is the only sign-in.

### Premium

- The review account is Premium through a promotional `premium` entitlement granted in RevenueCat for life to that Account — the webhook lands in PRODUCTION, the mirror follows ADR 0006, no code involved.
- No hidden button, demo mode or review bypass exists in the app.
- The purchase itself is tested by the Apple reviewer with another Account (their own Apple ID), in the sandbox; the Play reviewer never purchases.

### Paywall

- The paywall lists only the Premium features that ship: Replay and Catch-up. Any feature without code leaves the list.

### Review notes (both stores, in English)

- Sign in with Apple accepts any Apple ID; Google uses the review account.
- The review account is already Premium; to test the subscription purchase, sign out and Continue with Apple with your own Apple ID.
- Path to the Premium features: open Compétition, play today's attempt, then Replay appears; Catch-up appears when yesterday has no attempt. The pseudo is born by itself.

### Test seams

- The paywall list is a constant in the premium feature's `constants.ts`; `bun run check` is the proof.

### Out of scope

- Demo mode, review backdoor, Play License testing, web.

## Items

```json
[
  {
    "category": "mobile",
    "description": "The paywall announces only Replay and Catch-up",
    "steps": [
      "PAYWALL_FEATURES contains exactly « Rejouez la compétition quotidienne » and « Lancez la compétition quotidienne de la veille », in that order",
      "bun run check green from the repo root"
    ],
    "passes": true
  }
]
```

## Human steps

1. Change the studio Gmail's password — it transited in clear.
2. Create the review Google account per the decision; note its credentials in `.private/`.
3. Google Cloud: OAuth consent screen « In production »; an Android OAuth client carrying the Play App Signing SHA-1; both client IDs listed in Supabase's Google provider.
4. Sign in once in Mentis (production variant) with the review account: this creates the Account and the RevenueCat customer.
5. RevenueCat: webhook set to « Sandbox and Production »; grant `premium` for life to the review account's customer; the app then shows « Compte Premium ».
6. App Store Connect: a sandbox purchase with one of the studio's sandbox testers picks the monthly product on the production variant; the subscription is attached to the submitted version; App Review Information carries « Sign-in required », the credentials and the notes.
7. Play Console: App access → « All or some functionality is restricted », the credentials and step-by-step instructions.
8. The Railway API and Supabase stay up for the whole review.
