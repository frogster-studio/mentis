# PRD — Mentis Card Back-Office

## Problem Statement

Editors writing general-knowledge content for short video/audio formats have no structured place to store it. Pieces live scattered across notes and documents: there is no consistent structure per format, no way to search or filter a growing library, no record of what is ready versus still being written, and no way for a future app to consume the content programmatically. Finding "that riddle about Mendès France" among hundreds of pieces is guesswork.

## Solution

A simple, authenticated back-office web app — the Mentis Card library — where allowlisted editors create, browse, edit, and delete **Cards**: units of general-knowledge content in one of five strictly structured **Card Types** (Quiz, True/False, Anecdote, Did You Know, Riddle). Cards carry an editor-facing **Title**, free-form **Tags**, a **Draft/Published** status, and up to three ordered, captioned **Images**. Editing happens in a half-width sidebar over the list — no page hopping — and every open Card has a shareable URL. Because fields are structured (not free-form blobs), a future consumer app can read the library without migration.

## User Stories

### Authentication

1. As an editor, I want to log in with my email and the shared password, so that only trusted people can touch the library.
2. As an editor, I want login rejected when my email is not on the allowlist, so that strangers cannot get in even if the password leaks.
3. As an editor, I want login rejected on a wrong password, so that the allowlist alone is not enough to get in.
4. As an editor, I want my session to persist across browser restarts, so that I don't log in every day.
5. As an editor, I want a log-out action, so that I can end my session on a shared machine.
6. As a visitor who is not logged in, I want every back-office URL to redirect me to the login page, so that no content leaks to the public.

### Browsing the library

7. As an editor, I want a table of all Cards sorted by last update, so that recent work surfaces first.
8. As an editor, I want each row to show Title, Card Type, Status, Tags, and last-updated time, so that I can identify a Card without opening it.
9. As an editor, I want to search Cards by Title, so that I can find a specific Card in seconds.
10. As an editor, I want to filter the list by Card Type, so that I can see, say, only Riddles.
11. As an editor, I want to filter the list by Status, so that I can see what is still Draft.
12. As an editor, I want to filter the list by Tag, so that I can pull up everything about "histoire".
13. As an editor, I want to combine search and filters, so that I can narrow a large library precisely.
14. As an editor, I want to clear all filters in one action, so that I can get back to the full list quickly.
15. As an editor, I want the list paginated, so that hundreds of Cards stay fast to load and scan.
16. As an editor, I want my current search, filters, and page reflected in the URL, so that a refresh or a shared link lands on the same view.

### Creating Cards

17. As an editor, I want a "new Card" action that first asks me to pick a Card Type, so that I get the right form for the format I'm writing.
18. As an editor, I want the Quiz form to capture a question, exactly four free-text Choices, which one is correct, and an Explanation, so that a future app can run the quiz mechanically.
19. As an editor, I want the True/False form to capture an Assertion, the true/false answer, and an Explanation, so that the reveal is stored with the claim.
20. As an editor, I want the Riddle form to capture the Clues, the Answer, and optional Bonus Info, so that the "et pour info…" extra lives with the riddle.
21. As an editor, I want the Anecdote form to capture a single body text, so that story-like facts stay simple to write.
22. As an editor, I want the Did You Know form to capture a single body text, so that concept explainers stay simple to write.
23. As an editor, I want the Title to be required on every Card, so that the list stays scannable.
24. As an editor, I want to add any number of free-form Tags while writing, so that I can theme content without a rigid taxonomy.
25. As an editor, I want new Cards to default to Draft, so that half-written content never looks ready.
26. As an editor, I want multiline plain-text fields that preserve my line breaks, so that my performance pacing survives storage.
27. As an editor, I want inline validation errors on save (missing Title, missing correct Choice, …), so that I know exactly what to fix.

### Editing Cards

28. As an editor, I want clicking a Card in the list to open it directly in an editable half-width sidebar, so that I can fix things without navigating away from the list.
29. As an editor, I want the URL to change when a Card is open, so that I can share a link to exactly that Card.
30. As an editor, I want opening a shared Card URL to show the list with that Card's sidebar already open, so that the link lands where the sender intended.
31. As an editor, I want closing the sidebar to return me to the list with my search and filters intact, so that I don't lose my place.
32. As an editor, I want to switch a Card between Draft and Published, so that I can mark content ready or pull it back.
33. As an editor, I want to change a Card's Type behind an explicit data-loss warning, so that I can recast content while understanding that type-specific fields will be cleared.
34. As an editor, I want Title, Tags, Status, and Images to survive a Type change, so that only the fields that don't map are lost.
35. As an editor, I want to see when a Card was created and last updated, so that I can judge how fresh it is.

### Images

36. As an editor, I want to attach up to three Images to a Card, so that the audience gets illustrations alongside the content.
37. As an editor, I want only `.png`, `.jpg`, `.jpeg`, and `.webp` files accepted, so that unsupported formats fail at pick time, not at save time.
38. As an editor, I want images smaller than 1000×1000 pixels rejected immediately with a clear message, so that low-resolution illustrations never enter the library.
39. As an editor, I want no upload file-size limit, so that I can pick a raw photo straight from my camera without pre-shrinking it.
40. As an editor, I want each image automatically compressed, downscaled, and converted to webp when I hit create or update, so that the library stays small without manual work.
41. As an editor, I want each image to succeed or fail independently at save time, so that one bad file never blocks the others.
42. As an editor, I want the Card itself to always save even when some images fail, so that my text work is never lost to an image problem.
43. As an editor, I want a red strip with a message on each failed image thumbnail, so that I understand what was stored and what wasn't.
44. As an editor, I want to retry a failed image or remove it from the Card, so that I can resolve failures on my own terms.
45. As an editor, I want to reorder a Card's Images, so that they appear in the sequence the audience should see.
46. As an editor, I want an optional Caption on each Image, so that the audience gets context with the illustration.
47. As an editor, I want to remove an existing Image while editing, so that outdated illustrations can be replaced.
48. As an editor, I want image thumbnails in the form, so that I can see what's attached at a glance.

### Deleting Cards

49. As an editor, I want to delete a Card behind a confirmation dialog, so that a stray click never destroys content.
50. As an editor, I want a deleted Card's Images removed from storage with it, so that the bucket doesn't fill with orphans.

### Future consumption

51. As a developer of a future consumer app, I want every Card Type's fields stored in a strict, machine-readable structure, so that the app can render quizzes and riddles without parsing prose.
52. As a developer of a future consumer app, I want Published as an explicit status, so that the app can safely consume only validated content.

## Implementation Decisions

- **Stack**: Next.js (App Router) deployed on Vercel; Supabase provides Postgres and Storage. Styling with Tailwind (SKY and ZINC palettes) and shadcn/ui; buttons carry lucide icons. UI copy is English; content is French.
- **Domain naming**: the glossary in `CONTEXT.md` governs all naming (Card, Card Type, Choice, Explanation, Bonus Info, Title, Tag, Image, Caption, Draft, Published). The domain `Card` type must not collide with shadcn's `Card` UI component — the UI import is aliased or namespaced by convention.
- **Schema**: a single `cards` table with shared columns (id, type, title, tags as a text array, status, created/updated timestamps), a jsonb payload for type-specific fields, and a jsonb array for Images (storage path, order, optional caption). No author attribution — timestamps only.
- **Validation**: one discriminated-union schema (zod) over the five Card Types, shared between the form (client) and the server, is the single source of truth for field structure — Quiz enforces exactly four Choices and exactly one correct; True/False enforces a boolean answer; Riddle's Bonus Info is optional; Anecdote and Did You Know share a body-only shape but remain distinct type values.
- **Auth**: no Supabase Auth. Credentials are checked server-side against two env vars — a comma-separated email allowlist and a single shared password. Success issues a signed HTTP-only session cookie; middleware guards every back-office route. Postgres is only ever accessed server-side with the service-role key; no RLS.
- **Image pipeline** (per ADR 0001 — browser-only image processing): all validation and processing happens in the browser. Format and minimum-dimension checks run at file-pick time; at save time each image is downscaled to at most 1920px on its longest side and encoded to webp at ~80 quality, then uploaded directly to Supabase Storage via server-generated signed upload URLs. Originals are never stored. The bucket is public-read; writes go only through signed URLs.
- **Save semantics**: the Card row always saves; each image processes and uploads independently. Successful images are recorded on the Card; failed ones surface a red strip on their thumbnail in the form. Failure state is ephemeral — it lives only in the open form and is gone after a refresh (the source file is unrecoverable then anyway).
- **Type change**: allowed on existing Cards behind a data-loss warning dialog; shared fields (Title, Tags, Status, Images) are preserved, type-specific fields are cleared.
- **Deletion**: hard delete behind a confirmation dialog; the server removes the row and its storage objects. No trash/restore.
- **Sidebar and URLs**: create/edit happens in a half-width sidebar over the list. Open Cards are addressable (`/cards/{id}`; creation at `/cards/new`), and list state (search, filters, page) lives in query params so views are shareable and refresh-safe. Cold-loading a Card URL renders the list with the sidebar open.
- **List querying**: server-side pagination, sorted by last update descending; title search and Type/Status/Tag filters compose.
- **Concurrency**: last-write-wins; no locking or conflict detection.

## Testing Decisions

- **What makes a good test here**: tests exercise external behavior at a seam — inputs in, observable results out. No assertions on internals (function call counts, private state, DOM structure of shadcn components). A schema test feeds a payload and asserts accept/reject; a pipeline test feeds a file and asserts the output blob's properties or the per-image failure result.
- **Seams under test** (greenfield — no prior art; vitest is established as the test runner):
  1. **Card validation schemas** — the discriminated union: accepts valid payloads per Card Type; rejects a Quiz with three or five Choices, zero or two correct Choices, a missing Title, an unknown type value.
  2. **Server data layer** — the CRUD and list-query actions, tested against a Supabase test double or local Supabase: create/update round-trips each Card Type; search, each filter, and their composition; pagination; hard delete removes the row and requests image cleanup; Type change preserves shared fields and clears type-specific ones.
  3. **Browser image pipeline** — a pure module with an injectable encoder: rejects wrong formats and sub-1000×1000 inputs; resize math caps the longest side at 1920px without upscaling smaller-than-cap images; each image resolves or fails independently; an encoder failure yields a per-image error, never a thrown batch.
  4. **Auth helpers** — credential verification against allowlist and shared password (case/whitespace handling in the email list, empty env vars) and session cookie issue/verify round-trip.
- **Not tested in v1**: end-to-end browser flows (Playwright) — the app is small enough to smoke-test by hand.

## Out of Scope

- The consumer-facing app and any public read API — the structured schema is the only concession to it.
- Roles, permissions, per-user passwords, or author attribution (`created_by`); anyone allowlisted can do everything, and only timestamps are recorded.
- Soft delete, trash, restore, or version history.
- Rich text or markdown — all text is plain multiline.
- Statuses beyond Draft/Published (no "used/archived" tracking).
- Server-side image processing, storage of original files, or image variants (per ADR 0001).
- i18n framework — English UI strings are hardcoded.
- Concurrent-edit protection beyond last-write-wins.
- Mobile-first layout — the back-office is desktop-first (the half-width sidebar assumes a wide viewport).
- Playwright/E2E test infrastructure.

## Further Notes

- The five Card Type examples in `brief.md` are the canonical reference for tone and field content — French, conversational, humor inside Quiz Choices.
- Anecdote and Did You Know share an identical field shape but are deliberately distinct Card Types: the difference is editorial (story vs. concept explainer) and matters to downstream consumers.
- ADR 0001 (browser-only image processing) records why there is no server-side image work and why originals are unrecoverable; revisit it before adding any feature that needs higher-resolution assets.
