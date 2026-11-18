# PRD — The Editor creates, edits and deletes Anecdotes, and every admin image follows one rule

Vocabulary: [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) (Anecdote, Anecdote Image) and [apps/admin/CONTEXT.md](apps/admin/CONTEXT.md) (Editor). Rules: [AGENTS.md](AGENTS.md), [apps/admin/AGENTS.md](apps/admin/AGENTS.md) (read `node_modules/next/dist/docs/` before Next code), [apps/api/AGENTS.md](apps/api/AGENTS.md), [docs/agents/conventions.md](docs/agents/conventions.md), [apps/admin/docs/ui-conventions.md](apps/admin/docs/ui-conventions.md), [ADR 0007](docs/adr/0007-theme-image-bytes-never-transit-the-api.md), [ADR 0010](docs/adr/0010-anecdote-images-transit-the-api-validated-never-transformed.md). Also closes [issue 84](https://github.com/frogster-studio/mentis/issues/84).

## Decisions

### Scope

- The Anecdotes workspace (PR 83) gains create, edit text, set or replace the Anecdote Image, and delete.
- No route and no control removes an Anecdote Image on its own: a replacement corrects a wrong one.
- Deleting an Anecdote deletes its Anecdote Image from storage: an Anecdote Image belongs to one Anecdote and is never shared.
- Out of scope: any mobile change, any entity change, `docs/agents/daily-question.md` (its `POST /admin/anecdotes` and `PUT /admin/anecdotes/:id/image` keep working unchanged), the Theme's signed upload, reset to `default.webp` and cleanup tokens.
- No new dependency, no new ADR.

### One admin image rule (issue 84)

- The Theme drop zone and the Anecdote drop zone enforce the same rule, in the browser only: WebP, 750 × 1024 px exactly, at most 204 800 bytes, not animated.
- The browser reads the WebP signature, the VP8X animation flag and the dimensions; extension, signature and MIME type must agree.
- Nothing is converted, resized or re-encoded anywhere: the file is uploaded as dropped.
- The six messages, the same for both drop zones:
  - wrong format (extension, signature or type mismatch): « L’image doit être un fichier WebP. »
  - animated: « L’image ne doit pas être animée. »
  - wrong dimensions: « L’image doit mesurer 750 × 1024 px. »
  - over 204 800 bytes: « L’image dépasse 200 Ko. »
  - unreadable: « Impossible de lire cette image. Choisissez un autre fichier. »
  - several files: « Choisissez une seule image à la fois. »
- The hint under both drop zones: « Image **WebP** · **750 × 1024 px** · **200 Ko** maximum. » Nothing else; the « converties automatiquement » line goes.
- The preview is a 750/1024 frame; an image that is not at that ratio (legacy Theme images, `default.webp`) shows whole inside it (`object-contain`).
- An Anecdote without an Anecdote Image shows an empty dashed frame, no label. The Theme keeps its `default.webp`.
- API rules don't change: the Theme signed upload and bucket keep 2 MiB, so legacy Theme images stay valid; the Anecdote route keeps its own server-side checks.

### Theme drop zone

- The Theme loses its in-browser conversion: the worker, `@jsquash/webp`, the image-codec prepare script and its dev/build wiring all go. JPG and PNG are refused with the format message.
- Everything else about the Theme stays: signed upload, reset to `default.webp`, cleanup tokens, the reset control.

### API

- `PATCH /admin/anecdotes/:id` takes the POST's `{ text }` schema (trimmed, 1 to 140 characters, `**` and `__` markers counted) and answers the whole Anecdote, `AdminAnecdoteResponse`, its `image` unchanged.
- `DELETE /admin/anecdotes/:id` deletes the stored image object first, then the row, and answers 204. An Anecdote without an image makes no storage call.
- A failed storage deletion answers 502 « Impossible de supprimer l’image. Réessayez. » and leaves the row. A failed row deletion after the storage one is finished by a retry, since removing an absent object is a no-op. No orphan image is ever left by a delete.
- PATCH and DELETE answer 404 « Anecdote introuvable. » for an unknown id and 400 for a non-UUID id; both sit behind `EditorGuard` then `AuthenticatedThrottlerGuard`.
- Messages meant for the Editor are in French.
- `PUT /admin/anecdotes/:id/image` keeps its behavior: the previous object is deleted after the save, a failed deletion ignored.

### Admin proxy and client

- The proxy exports PUT too. A non-JSON body is forwarded as raw bytes with its own `Content-Type`; JSON routes are forwarded exactly as today.
- The API client gains a raw-file PUT and handles a 204 answer.

### Anecdotes workspace

- Same shape as the Questions workspace: the list on the left, a « Details » Column on the right, a `+` icon button in the list's header band creates.
- The selection lives in the URL as `?anecdote=<id>`, beside `?q=`.
- Text field: plain textarea where the Editor types `**` and `__` themselves; the markers stay visible as typed. Below it, a live read-only preview rendered by `anecdoteSegments`, and a counter `n / 140` counting the stored (trimmed) text, markers included. No formatting buttons, no editor library.
- SAVE sends the text first (POST for a new Anecdote, PATCH otherwise), then the dropped image if any (PUT).
- A failed image upload keeps the text saved, keeps the dropped file in the form for a retry and shows the API's French message. A new Anecdote whose image failed becomes the selected saved Anecdote.
- Every mutation invalidates `curationKeys.anecdotes`.
- A dirty form calls `useReportUnsavedChanges(isDirty)`; switching row or workspace with a dirty form asks « This form has unsaved changes. Leave anyway? », as the Questions workspace does.
- Delete goes through the existing `Dialog`: « Supprimer cette Anecdote ? Son image sera supprimée avec elle. » Afterwards the selection clears and the list refetches.

### Mobile

- No change. A device that drew a deleted Anecdote today keeps its text until tomorrow and its image stops loading: accepted.

### Docs

- ADR 0007 is amended, not replaced: the browser no longer converts; it enforces the shared rule; the API and bucket keep 2 MiB for legacy images. Every conversion and codec line goes.
- ADR 0010 is amended, not replaced: the dashboard now has an Anecdote Image screen that sends the finished file through the proxy, unconverted; deleting an Anecdote deletes its image. The line that reopens it on in-browser conversion stays true and stays.
- ADRs stay forward-only: rewrite the rule as it now is, no history, no banner.

### Test seams

- Shared image rule: pure-function unit tests per message, prior art `apps/admin/src/features/curation/theme-image.test.ts`; WebP fixtures as in `apps/api/src/curation/_tests/webp-fixtures.ts`.
- Proxy and client: unit tests with a stubbed `fetch`, prior art `theme-image-upload.test.ts`.
- API: e2e through the Nest testing module with a fake repository and a fake Supabase storage, prior art `admin-curation.e2e-spec.ts` and `admin-anecdote-image.e2e-spec.ts`.
- Workspace: component tests, prior art `category-form.test.tsx` and `catalog-search.test.tsx`.

## Items

```json
[
  {
    "category": "admin",
    "description": "One shared image rule, as pure functions, serves both drop zones: WebP, 750 × 1024 px, at most 204 800 bytes, not animated",
    "steps": [
      "A JPG, a PNG, a file whose extension, signature or MIME type disagree: « L’image doit être un fichier WebP. »",
      "An animated WebP (VP8X animation flag set): « L’image ne doit pas être animée. »",
      "A static WebP at any size but 750 × 1024: « L’image doit mesurer 750 × 1024 px. »",
      "A 750 × 1024 static WebP of 204 801 bytes: « L’image dépasse 200 Ko. »; at 204 800 bytes: accepted",
      "An undecodable file: « Impossible de lire cette image. Choisissez un autre fichier. »",
      "Unit tests cover each message, prior art theme-image.test.ts",
      "bun run check green"
    ],
    "passes": false
  },
  {
    "category": "admin",
    "description": "The admin proxy and API client carry a raw-file PUT and a 204 answer",
    "steps": [
      "The proxy route exports PUT alongside GET, POST, PATCH and DELETE",
      "A PUT with an image/webp body reaches the API byte-identical with Content-Type image/webp",
      "A JSON POST or PATCH reaches the API exactly as before",
      "The client sends a File or Blob by PUT and parses the response with a contract schema; a DELETE answering 204 resolves",
      "Unit tests with a stubbed fetch, prior art theme-image-upload.test.ts",
      "bun run check green"
    ],
    "passes": false
  },
  {
    "category": "api",
    "description": "PATCH /admin/anecdotes/:id replaces an Anecdote's text",
    "steps": [
      "A valid { text }: 200 with the whole Anecdote, the new text and the image unchanged",
      "An empty text or one over 140 characters (markers counted): 400",
      "A non-UUID id: 400; an unknown id: 404 « Anecdote introuvable. »",
      "Without an Editor session: refused like every /admin/* route",
      "The existing POST /admin/anecdotes and PUT /admin/anecdotes/:id/image e2e stay green",
      "e2e through the Nest testing module with a fake repository, prior art admin-curation.e2e-spec.ts",
      "bun run check green"
    ],
    "passes": false
  },
  {
    "category": "api",
    "description": "DELETE /admin/anecdotes/:id deletes the Anecdote Image from storage, then the Anecdote",
    "steps": [
      "An Anecdote with an image: 204; the storage removal of its path happens before the row deletion",
      "An Anecdote without an image: 204 and no storage call",
      "A failing storage removal: 502 « Impossible de supprimer l’image. Réessayez. » and the row is still there",
      "A row deletion failing after the storage removal: a second DELETE answers 204 and removes the row",
      "A non-UUID id: 400; an unknown id: 404 « Anecdote introuvable. »",
      "e2e with a fake repository and a fake Supabase storage, prior art admin-anecdote-image.e2e-spec.ts",
      "bun run check green"
    ],
    "passes": false
  },
  {
    "category": "admin",
    "description": "The Theme drop zone loses its conversion and applies the shared image rule",
    "steps": [
      "The worker, @jsquash/webp, the image-codec prepare script and its dev/build wiring are gone; knip reports nothing",
      "Dropping a JPG or PNG on a Theme shows « L’image doit être un fichier WebP. »",
      "A valid 750 × 1024 WebP is uploaded by the signed upload exactly as dropped",
      "The hint reads « Image WebP · 750 × 1024 px · 200 Ko maximum. » with WebP, 750 × 1024 px and 200 Ko in bold; the conversion line is gone",
      "The preview is a 750/1024 frame showing the whole image (object-contain), legacy images and default.webp included",
      "Reset to default.webp and cleanup tokens behave and test as before",
      "bun run check green"
    ],
    "passes": false
  },
  {
    "category": "admin",
    "description": "The Anecdotes workspace opens a Details column to create an Anecdote and edit its text",
    "steps": [
      "Clicking a row shows its form in a « Details » Column to the right; the URL carries ?anecdote=<id> beside ?q=, and a reload restores the selection",
      "The + icon button in the list's header band (aria-label and title) opens an empty form",
      "The textarea keeps ** and __ visible as typed; a live preview below renders bold and italic through anecdoteSegments; a counter shows n / 140 on the trimmed text",
      "SAVE is disabled for an empty text or one over 140; it POSTs a new Anecdote and PATCHes an existing one, then the list refetches",
      "A dirty form reports itself through useReportUnsavedChanges; switching row asks « This form has unsaved changes. Leave anyway? »",
      "Component tests, prior art category-form.test.tsx",
      "bun run check green"
    ],
    "passes": false
  },
  {
    "category": "admin",
    "description": "The Anecdote form sets or replaces the Anecdote Image on SAVE",
    "steps": [
      "The drop zone uses the shared rule and hint; an Anecdote without image shows an empty dashed 750/1024 frame, no label",
      "A dropped valid file shows a local preview and makes the form dirty",
      "SAVE sends the text first, then PUTs the file; the list's thumbnail shows the new image",
      "A failing PUT keeps the text saved, keeps the file in the form and shows the API's French message; a new Anecdote becomes the selected saved one",
      "No control removes the image on its own",
      "Component tests with a stubbed API",
      "bun run check green"
    ],
    "passes": false
  },
  {
    "category": "admin",
    "description": "The Editor deletes an Anecdote after a confirmation Dialog",
    "steps": [
      "The delete control opens the existing Dialog « Supprimer cette Anecdote ? Son image sera supprimée avec elle. »",
      "Dismissing deletes nothing; confirming sends DELETE, clears ?anecdote and the selection, and the list refetches",
      "A 502 shows « Impossible de supprimer l’image. Réessayez. » and keeps the Anecdote selected",
      "Component tests with a stubbed API",
      "bun run check green"
    ],
    "passes": false
  },
  {
    "category": "docs",
    "description": "ADR 0007 and ADR 0010 are amended to the new rule",
    "steps": [
      "ADR 0007: no conversion or codec line left; the browser enforces WebP, 750 × 1024 px, at most 204 800 bytes, not animated; the API and bucket keep 2 MiB for legacy images",
      "ADR 0010: the dashboard has an Anecdote Image screen sending the finished file unconverted through the proxy; deleting an Anecdote deletes its image; the reopening line on in-browser conversion stays",
      "Forward-only: no history, no banner, no new ADR",
      "docs/agents/daily-question.md unchanged",
      "bun run check green"
    ],
    "passes": false
  }
]
```

## Human steps

- After every item passes: verify in the Browser pane behind a real Editor session — create, edit, set and replace an Anecdote Image, delete, and a Theme image drop. The PR says what was not verified behind a real session.
- Add « Closes #84 » to PR 83's description, then merge.
- No migration: no entity changes.
