# PRD — Mentis : Accounts & cross-device stats

## Problem Statement

A Player's Theme Averages live and die with one phone. Lose the device, reinstall the app, or simply switch between an iPhone and an Android tablet, and the trophy shelf starts from zero — months of play erased with nothing to show for it. There is also nowhere for the game to go socially: leaderboards and friend battles are impossible while every Player is an anonymous island. Yet the founding promise must hold — nothing may ever stand between a Player and their first question, and solo play must never demand an account.

## Solution

An optional **Account**, created by signing in with Google or Apple — two taps, no form. Signed out, nothing changes: the full game stays playable forever, stats accumulating on the device as today. Signing in opens a second, disjoint world: **Account Stats**, the union of every finished Quiz Session across all the Player's devices. At first sign-in on a device that already holds Device Stats, one French prompt offers a **Stats Transfer** — a consented move of the local history into the Account. From then on every finished session lands on the Account instantly (offline included, syncing itself in the background), and opening the app on any other device shows the same shelf. The Account is also the quiet foundation of the social era to come — leaderboards and battles will require one — but v1 ships exactly two things: sign-in and sync. Sign-out returns the device to its anonymous world; an in-app « Supprimer mon compte » erases everything server-side.

## User Stories

### Signing in

1. As a Player, I want to sign in with Google or Apple in two taps and zero form fields, so that creating my Account costs nothing.
2. As a Player on iOS or Android, I want the native sign-in sheet of my platform (Apple's Face ID dialog, Google's account sheet) with no browser bounce, so that signing in feels like the OS, not a website.
3. As a Player on Web, I want to sign in with the same providers through the standard redirect flow, so that one Account follows me across all three platforms.
4. As a Player, I want every part of solo play to work without an Account, forever, so that the founding « no account required » promise survives the arrival of accounts.
5. As a Player facing the sign-in screen, I want a short French pitch of what an Account gives me (my stats follow me everywhere), so that I choose knowingly rather than by reflex.
6. As a signed-in Player, I want to stay signed in across app restarts until I explicitly sign out, so that authentication is a one-time act, not a chore.

### Stats Transfer

7. As a Player with existing Device Stats, I want exactly one French prompt at sign-in offering to transfer them into my Account, so that my pre-account history is never silently taken nor silently lost.
8. As a Player who accepts the Stats Transfer, I want the transferred stats counted into my Account exactly once — however many times the app retries, restarts, or re-syncs — so that my averages are never inflated.
9. As a Player who declines the Stats Transfer, I want my Device Stats kept intact but dormant, hidden while I am signed in and back on screen after sign-out, so that declining is safe and reversible in spirit.
10. As a Player lending my phone to someone who signs into their own Account, I want their decline to keep their Account clean and my anonymous stats untouched, so that a borrowed phone can never pollute either side.
11. As a Player who accepted a transfer, I want the signed-out home to be visibly empty afterwards with the French explanation that my stats now live on my Account, so that the move — not a copy — is honest and understood.

### Cross-device sync

12. As a signed-in Player, I want a finished session to appear in my home shelf instantly — even in the métro with no signal — so that signing in never degrades the offline-first feel of the game.
13. As a signed-in Player, I want sessions finished offline to push themselves automatically once the app regains network (at foreground, at launch, at the next finish), so that syncing requires zero action from me.
14. As a signed-in Player opening the app on a second device, I want my complete Account Stats to appear as soon as the app fetches — at sign-in, launch and foreground — so that same-evening continuity between devices just works.
15. As a signed-in Player on a flaky connection, I want retried pushes to never double-count a session, so that my Theme Averages stay exact no matter how ugly the network was.
16. As a signed-in Player, I want each Theme Average derived from every finished session on every device plus my transferred history, so that the shelf reflects my whole playing life.
17. As a signed-in Player launching the app offline, I want my last-known Account Stats rendered from cache, so that the home screen never needs network to exist.
18. As a signed-in Player, I want a Theme that later disappears from the catalog to keep its name in my stats, so that content rotation can never orphan or rename my history.

### The two worlds

19. As a Player, I want home to show Account Stats while signed in and Device Stats while signed out — never a silent mix, so that I always know whose numbers I am looking at.
20. As a Player signing out, I want a French confirmation explaining that my stats stay safe on my Account and the device returns to its local world, so that sign-out never feels like deletion.
21. As a Player who signs out while offline with unpushed sessions, I want those sessions kept locally, tagged to my Account, and pushed when I next sign in, so that no finished session is ever lost to timing.
22. As a second Player signing into their Account on the same device, I want nothing from the previous world to cross over without the explicit transfer consent, so that Accounts never bleed into each other.

### Account screen & lifecycle

23. As a Player, I want a profile icon in the home header opening the « Compte » screen, with the icon reflecting whether I am signed in, so that my Account is one tap away without cluttering play.
24. As a signed-out Player on the results screen, I want a discreet dismissible nudge — « Sauvegarde ta progression » — so that the moment of peak motivation reminds me the option exists.
25. As a Player who dismissed the nudge, I want it gone for good, so that the app respects a decision made once.
26. As a signed-in Player, I want « Supprimer mon compte » behind a French confirmation, erasing my identity and every synced row server-side, so that leaving is as clean as arriving (and store rules are honored).
27. As a Player who signs in with Google on one device and Apple on another using the same verified e-mail, I want one single Account, so that ordinary multi-provider use never splits my stats.
28. As a Player, I want the name my provider offers (Apple sends it only at the very first sign-in) captured immediately into my Account, so that the future pseudo suggestion has something to start from.
29. As a Player who deleted my Account, I want stray unsynced sessions on some other device to be discarded gracefully at their next push attempt, so that deletion never causes errors or ghost data.

### Platform & owner

30. As a Player on iOS, I want Sign in with Apple offered wherever Google sign-in is, so that the app complies with Apple's marketplace rules.
31. As the product owner, I want the web app served from a real HTTPS domain registered with Apple, so that Sign in with Apple works on the web at all.
32. As the product owner, I want a privacy policy URL live and referenced by both stores before release, so that the account feature clears review.
33. As a French-speaking Player, I want every new string — pitch, prompts, buttons, confirmations, nudge — in French, so that the Account era feels as native as the game.
34. As the product owner, I want sign-in verified working in development and production builds on iOS, Android and Web, so that no platform ships with a broken provider configuration.

## Implementation Decisions

- **Backbone** (per the Supabase-only ADR): Supabase Auth carries identity; per-user data lives in new tables the client reads and writes directly under owner-scoped RLS. No separate backend, no edge-function API layer. The known forgeable-own-rows risk is accepted while stats are private.
- **Providers & flows**: Google and Apple only. Mobile uses the native token flows — the platform sign-in sheet yields an ID token handed to Supabase — via the community Google sign-in module and the Expo Apple authentication module (both installed in the issue that first uses them, per repo rule; they require development builds, superseding the v1 PRD's Expo-Go-compatibility note). Web uses Supabase's OAuth redirect flow. The Supabase client flips to persisted, auto-refreshed sessions.
- **Identity linking**: Supabase automatic linking by matching verified e-mail, nothing more. Apple's Hide-My-Email can therefore yield a second distinct Account — documented, accepted, no linking UI, no account merge; in-app deletion is the escape hatch for accidental duplicates.
- **Name capture**: the full name offered by Apple at the very first sign-in (never re-sent) and the Google profile name are stored into the Account's metadata immediately, as raw material for a future pseudo suggestion. No pseudo UI in v1.
- **Schema** (per the append-only sync ADR): two player tables. Sessions — one row per finished Quiz Session with a client-generated UUID key, the owner, the Theme id and Theme name captured at record time, the points, and the finish timestamp; inserts are idempotent upserts on the UUID. Baselines — one row per (owner, device, Theme) holding the transferred pre-account totals, written insert-if-absent so the Stats Transfer is idempotent per device. Both reference the auth user with cascade on delete; neither references content tables, because seeding replaces hosted Themes.
- **RLS**: owner-only insert and select on both tables; no update or delete policies (append-only data; account deletion cascades server-side).
- **Device identity**: a random UUID minted once per install and persisted, used solely to key baselines. No fingerprinting.
- **The two worlds**: Device Stats remain exactly today's persisted store, untouched in shape and behavior. Account Stats are always derived, never stored: a pure fold of baselines + synced sessions + still-pending local sessions into the existing per-Theme aggregate shape, so the existing average derivation and home-shelf construction are reused as-is. A selector picks the world by auth state; the two never mix silently.
- **Sync rhythm**: optimistic local-first. A finished signed-in session is recorded locally first (home updates instantly), queued in a small persisted outbox tagged with its owner, and pushed immediately; failures stay queued and retry at launch, foreground and next finish. Pulls of Account Stats run through the existing query layer at sign-in, launch and foreground. No realtime channel, no background task scheduling.
- **Stats Transfer**: offered by one prompt at sign-in when the device world is non-empty; accepting builds baseline rows from the local aggregates and empties the device world (a move); declining marks the device world dormant — kept, hidden while signed in, shown again after sign-out. A later sign-in with a still-dormant world re-offers the prompt.
- **Outbox after the Account is gone**: a push rejected because the owner no longer exists discards the queued rows silently. Sign-out flushes what it can and keeps the rest, owner-tagged, for that Account's next sign-in.
- **Account deletion**: in-app, French confirmation, then server-side erasure of the auth user (rows follow by cascade) through a security-definer database function; a single narrow edge function is the sanctioned fallback if that path proves unworkable (the backbone ADR permits either). Local outbox and cached Account Stats are wiped with it.
- **UX surfaces**: a profile icon (Lucide) in the home header opens the new « Compte » screen — signed out: the French pitch above the two provider buttons; signed in: the identity, « Se déconnecter » and « Supprimer mon compte ». The results screen gains the signed-out-only « Sauvegarde ta progression » nudge; dismissing it persists forever. All copy in the feature's French constants module.
- **Console prerequisites** (no code can replace these): Google OAuth clients for iOS, Android and Web plus the web pair configured in Supabase's Google provider; the Apple capability on the App ID, a Services ID and the signing key for Supabase's Apple provider; the Supabase redirect-URL allowlist; a deployed HTTPS web domain; privacy policy URLs in both store listings.

## Testing Decisions

A good test exercises the **external behavior of a pure seam** — inputs to outputs, with randomness, time, UUIDs and device ids injected — never implementation details, never component rendering (the standing convention). Prior art: the existing six-seam vitest suite; the outbox suite mirrors the session-reducer transition-table style, the account-fold suite mirrors the stats suite.

- **Account Stats fold seam** (new): baselines + synced sessions + pending local sessions in, per-Theme aggregates out — reusing the existing aggregate shape so average derivation and home-card construction stay covered by the existing stats suite. Cases: multi-device baselines summing, the optimistic overlay of unpushed sessions, empty worlds, name capture precedence, no input mutation.
- **Outbox reducer seam** (new): the full transition table — enqueue on finish (injected UUID and timestamp), ack on push success, retention on failure, owner tagging, batch draining — and the idempotence invariant: any replay of any transition leaves totals correct.
- **Stats Transfer seam** (new): the offer predicate (non-empty, non-dormant device world), baseline payload construction from Device Stats with an injected device id, move semantics (accept empties the device world; decline marks dormancy), and re-offer behavior on a later sign-in.
- **Device-world stats seam** (existing, untouched): stays green as-is — signed-out behavior must not change.
- **Constants**: the French-copy sanity pattern extends to every new string.
- **Untouched suites stay green**: matching, session reducer, draw, countdown, shuffle, seed transform.
- **Live verification script** (extends the existing one, anon key only): the anonymous key can neither read nor write either player table. Authenticated-path RLS is exercised manually at implementation time — scripting OAuth-only sign-in is not worth the machinery in v1.
- **Deliberately untested thin shells**: provider flows (native sheets, web redirects), Supabase calls, query wiring, the « Compte » screen, the transfer prompt, the nudge.

## Out of Scope

- Leaderboards, battles, friends, sharing, any social surface — the Account only prepares the ground.
- Pseudo/display-name choice, avatars, public profiles (the captured provider name is stored, never shown).
- Manual identity linking UI and any account-merge machinery; un-splitting Hide-My-Email duplicates.
- E-mail/password, magic links, or any provider beyond Google and Apple.
- Realtime sync, OS background sync tasks, push notifications.
- Anti-cheat or server-side score validation (revisit, per the backbone ADR, before any leaderboard trusts these numbers).
- A session-history browser or any per-session UI; editing or deleting individual synced sessions.
- Re-attributing sessions between Accounts; multi-profile on one device.
- Changing anything about anonymous play, session mechanics, content, or the seed pipeline.

## Further Notes

- The glossary terms **Account**, **Device Stats**, **Account Stats** and **Stats Transfer** are normative for this PRD; the Supabase-only backbone ADR and the append-only sync ADR govern the architecture. This PRD consciously supersedes the v1 PRD's out-of-scope line on accounts; v1's story « play without creating an account » remains inviolate.
- The girlfriend scenario (a borrowed phone and a foreign Account) and the métro scenario (two devices playing offline the same day) are the canonical acceptance walks for the transfer prompt and the sync model respectively.
- GDPR posture: data resides in the existing eu-central-1 project, minimal PII (provider e-mail, captured name), and in-app deletion doubles as the erasure path.
- The console prerequisites are the long pole with no code workaround — notably the HTTPS domain Apple requires for web sign-in. Budget them early; the mobile native flows can ship and be tested before the web ceremony completes.
