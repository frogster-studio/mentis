# PRD — Premium paywall

Collapse of the Premium paywall wayfinder map (#38): the paywall sheet, the purchase flow, and the API's premium truth. Decisions inherited from ADR 0006 and the map's closed tickets; this PRD turns them into a buildable spec. Vocabulary: `apps/mobile/CONTEXT.md` (Player, Account, Premium).

## Problem Statement

A Player who wants more of Mentis has no way to pay for it. The Premium subscription exists in both stores and in RevenueCat, the app already identifies its purchases by Account — but no screen sells it, no purchase can happen, and the API cannot answer "is this Account premium right now", so nothing premium can ever be built on top.

## Solution

From the « Compte » screen, a signed-in Player taps a Premium button and gets a paywall sheet in the app's own design language: the pitch, the monthly price read live from the store, one purchase button, a discreet restore link. Buying runs the platform's native store flow through RevenueCat; a short activation moment covers the server catching up, and the screen then shows the Account as Premium. Server-side, the API mirrors the entitlement into its own table and answers premium truth locally at `GET /app/me/premium`, per ADR 0006.

## User Stories

1. As a signed-in Player, I want a Premium button on the « Compte » screen, so that I can discover and reach the paid tier.
2. As an anonymous Player, I want no Premium purchase entry, so that I am never sold something my device-only state cannot hold (Premium is a property of an Account).
3. As a signed-in Player, I want the paywall sheet to state what Premium is and its monthly price, so that I can decide with the real terms in front of me.
4. As a Player in any storefront, I want the price read from the store offering, so that the amount shown is exactly the amount charged.
5. As a signed-in Player, I want the purchase to run my platform's native store sheet, so that payment happens through the store account I already trust.
6. As a Player who cancels the store sheet, I want to land back on the paywall with no error shown, so that backing out feels like my choice, not a failure.
7. As a Player whose purchase fails, I want a readable French error in the sheet, so that I know to retry rather than wonder what happened.
8. As a Player who just bought Premium, I want a brief activation moment instead of a frozen screen, so that the seconds the server needs pass gracefully.
9. As a Player who just bought Premium, I want the « Compte » screen to show Premium immediately after, so that I see what I paid for.
10. As a Premium Player, I want the paywall entry replaced by my Premium status, so that I am never asked to buy what I already have.
11. As a Player reinstalling or switching devices, I want a « Restaurer mes achats » link on the paywall, so that my subscription follows me without support tickets.
12. As a Player restoring on a new Account with the same store account, I want the subscription to move to the Account I'm signed into, so that store truth wins (RevenueCat transfer behavior, accepted by the truth model).
13. As a Player whose restore finds nothing, I want a calm French notice, so that a no-op doesn't read as a crash.
14. As a Premium Player, I want my status shown even offline, so that my paid tier doesn't flicker with connectivity (SDK-cached CustomerInfo).
15. As a Player whose subscription lapses, I want premium-gated actions to treat me as free immediately, so that the expiry rule is honest (evaluated at action time, never revoked mid-session).
16. As a Player in a store grace period, I want to remain Premium, so that a billing hiccup doesn't punish me.
17. As a Player who cancels in the store settings, I want Premium to run until the period ends and then stop, without opening the app, so that truth follows the store, not my app usage.
18. As the operator, I want every RevenueCat event to only trigger a re-sync from the RevenueCat API, so that forged or replayed deliveries can never write state.
19. As the operator, I want the API's premium gate to be a local timestamp compare, so that premium checks work even with RevenueCat down.
20. As the operator, I want a sandbox purchase on a dev build to flip the real gate end-to-end, so that the whole chain is proven before real money touches it.

## Implementation Decisions

- **Truth model is ADR 0006, verbatim**: RevenueCat holds subscription truth; the API keeps one mirrored row per Account (`premium_entitlements`, already migrated); every gate is `premium_until > now()`. Webhook deliveries are triggers, never sources.
- **A new API feature owns premium**: the webhook endpoint, the re-sync service, the repository upsert, and the `GET /app/me/premium` read live together (the read is guarded by the Supabase user guard and the authenticated throttle, like every `/app/me/*` route).
- **Webhook endpoint** sits outside the `/app` and `/admin` namespaces, unthrottled (volume is bounded by RevenueCat's retry schedule and the JSON body cap): a constant-time compare of the static `Authorization` header, 401 on mismatch, 2xx acknowledgement otherwise. The body has **no contract schema** — it is untrusted input, read leniently: the endpoint collects every app-user id the payload names (`app_user_id`, and both sides of a TRANSFER), re-syncs each that parses as a UUID, and acknowledges regardless. An unparseable body is acknowledged and ignored.
- **Re-sync** fetches the customer's current entitlements from RevenueCat REST (Bearer `sk_` key) and overwrites the row: `premium_until` from the `premium` entitlement's expiry (null when absent), `environment` labeled from the triggering webhook's environment field — the one payload field read into state, harmless because both environments count as premium at MVP and it gates nothing.
- **RevenueCat REST client is an injectable provider** (the pattern of the existing Supabase config provider), so tests fake the outbound call at that seam — the API's first outbound-HTTP seam.
- **Contract**: a premium response schema in the app contracts — `{ active: boolean, until: ISO datetime | null }` — parsed by the API's own response and by the mobile seam.
- **Environment surface grows by two secrets** (webhook `Authorization` value, `sk_` REST key) in the zod-validated env config; `.env.example` updated in the same commit; Railway must carry both before the proof.
- **Paywall sheet is the house Sheet primitive**, composed from design tokens: pitch copy, price from the package's `priceString` (never a constant), one purchase `NewButton` with the pending-mutation treatment, a quiet « Restaurer mes achats » text link beneath. Offering fetch pending/failed states use the house feedback components. All copy French, in the feature's constants.
- **Purchase flow**: purchase the offering's single Monthly package; a user-cancelled purchase resets silently; any other failure renders a French error inside the sheet. Identity is already wired (configure/logIn on the Supabase uid, never logOut).
- **Post-purchase**: an activation animation while polling `GET /app/me/premium` every 3 seconds for up to 90 seconds (the webhook usually lands in 5–60 s); on success the sheet closes on the Premium state; on timeout it closes on a soft « activation en cours » note — the client display flips from CustomerInfo regardless, and deliberately no client-triggered refresh write exists.
- **Premium display** on « Compte » rides the SDK's CustomerInfo (`premium` entitlement active): instant at purchase, offline-cached. Server truth gates server actions alone. The CTA and status render on native platforms only; web shows neither.
- **Restore** uses the SDK's restore with its default transfer behavior; the truth model already absorbs the TRANSFER event (the losing Account's next re-sync nulls its row).

## Testing Decisions

- A good test exercises external behavior at the highest seam — HTTP status and body through the Nest app, state observable through the endpoints, screen-level logic through pure functions — never implementation internals.
- **API e2e through the Nest testing module** (prior art: the `/app/me` e2e spec with its fake repository and env): webhook auth (missing/wrong header 401, correct header 2xx), a valid delivery re-syncing through the faked RevenueCat provider and overwriting the mirror row, malformed bodies acknowledged without effect, TRANSFER re-syncing both sides; `GET /app/me/premium` unauthenticated 401, seeded future expiry → active, past expiry → inactive, no row → inactive.
- **Re-sync mapping as a pure unit**: RevenueCat entitlements payload → `{ premiumUntil, environment }`, including the absent-entitlement and grace-period-extended cases.
- **Contracts**: the premium schema gets a spec beside its siblings.
- **Mobile vitest stays pure-logic-only** (house rule): the seam-core premium call parsing its contract, and the poll-until-active-or-timeout logic with injectable time (prior art: countdown math, seam core specs). No component rendering tests; the paywall UI's proof is the map's sandbox purchase.

## Out of Scope

- Premium features themselves — Replay, Catch-up, premium practice gating: they build on `premium_until` afterwards (issue 009 and successors).
- Web: no purchase surface nor premium consumption on Expo web.
- Product variants: annual tier, lifetime, trials, intro/promo offers, family sharing.
- Release pipeline: EAS store builds, TestFlight, store submission.
- Subscription management UI — cancellation lives in the store's own settings.
- Tightening `environment` to PRODUCTION-only (a post-launch where-clause).
- The Android end-to-end proof: the code is cross-platform, iOS validates.

## Further Notes

- **The purchase-capable build is the production variant** (`bun run ios:prod`): only the production bundle id has store products, so the dev bundle fetches an empty offering that reads like broken config. Purchases there are still Apple sandbox; a sandbox purchase lands premium on a production Account — fine with zero users.
- Before the proof: verify the ADR 0003 lock was hand-run on `premium_entitlements` (RLS on, zero policies — it lives outside the repo), configure the webhook URL + `Authorization` header in the RevenueCat dashboard against the Railway URL, and set the two new secrets on Railway.
- Watch items from research: no official New-Architecture support statement for react-native-purchases (open iOS 26 beta crash), and RevenueCat REST's 480 req/min ceiling — both far from MVP scale.
