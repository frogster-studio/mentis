# PRD — An Anecdote may carry an Anecdote Image

Vocabulary: [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) (Anecdote, Anecdote Image) and [apps/admin/CONTEXT.md](apps/admin/CONTEXT.md) (Editor). Rules: [AGENTS.md](AGENTS.md), [apps/api/AGENTS.md](apps/api/AGENTS.md), [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md), [docs/agents/conventions.md](docs/agents/conventions.md), [ADR 0003](docs/adr/0003-database-admits-only-the-api.md), [ADR 0005](docs/adr/0005-the-api-reaches-its-data-through-typeorm.md), [ADR 0007](docs/adr/0007-theme-image-bytes-never-transit-the-api.md).

## Decisions

### Scope

- An Anecdote has at most one Anecdote Image, or none.
- The Editor sets it and replaces it through one `/admin/*` route. No route removes it: replacing corrects a wrong one.
- Out of scope: the admin dashboard, the daily question run (`docs/agents/daily-question.md`), any removal route.

### The stored image

- The API validates and never transforms: the caller sends a finished file, anything else is refused.
- Exactly 750×1024 px, WebP, static. Lossy or lossless are both accepted; an animated WebP is refused.
- At most 153 600 bytes (150 KiB). 100 KiB is the caller's target, not an API rule.
- The API reads the format, the dimensions and the animation flag from the file's own header, never from `Content-Type` alone and without a native dependency (no `sharp`).

### The route

- `PUT /admin/anecdotes/:id/image`, the raw file as body, `Content-Type: image/webp` (`curl --data-binary @image.webp`). Upload and replacement are the same call.
- `EditorGuard` then `AuthenticatedThrottlerGuard`, like every `/admin/*` route.
- 404 for an unknown Anecdote; 400 with a French message for a non-WebP body, an animated WebP or wrong dimensions; 413 above 153 600 bytes. Every one of them, the 413 the body parser raises included, is the `ErrorResponse` envelope.
- The raw body parser is scoped to this route alone: every other route keeps the JSON-only parser and its 64 kb cap.
- 200 answers the whole Anecdote: `{ id, text, image }`.

### Storage

- A dedicated public bucket, `anecdote-images`, created by hand on the dashboard.
- Each upload gets a fresh path, `<anecdote-id>/<upload-id>.webp`, so the CDN never serves a stale image.
- Order: upload the object, save the reference through TypeORM, then delete the previous object. A failed deletion still answers 200: the orphan is accepted. A failed save leaves the fresh object orphaned: accepted.
- No cleanup token, no orphan collector.

### Serving

- `AnecdoteEntity` gains a nullable `image` column, the bucket path.
- The admin contracts carry `image: string | null` (the path, like a Theme's `image`); `POST /admin/anecdotes` answers `image: null`.
- The app contract carries `imageUrl: string | null`, the full public URL composed by the API like a Theme's `imageUrl`.

### Docs

- ADR 0010, « Anecdote Images transit the API, validated never transformed »: there is no client to convert, and 150 KiB fits a raw body but not the JSON parser.
- ADR 0007 is rewritten to cover Theme images alone, forward-only: no banner, no history.
- `apps/api/AGENTS.md`: the « JSON only » rule and the « service client never touches Storage beyond Themes » rule both name the Anecdote Image route. Compact, the full reasoning stays in the ADR.

### Mobile — the card

- A photo icon sits at the bottom of the card's right column, under the dismiss cross, aligned with the bottom of the text zone: size 20, `inkMuted`, a bare `Pressable` dimmed with `PRESSED`, accessibility label « Voir l'image ».
- No Anecdote Image: no icon at all, never a disabled one.
- An Anecdote stored in the day set before `imageUrl` existed has no icon until the next draw.
- The peeling copy of a dismissed card stays inert, its icon included.
- The image of the top Anecdote is prefetched to the disk cache (`expo-image`) as soon as it becomes the top card.

### Mobile — the overlay

- A transparent `Modal`, not the `Sheet`: the image sits centred.
- The tap fades the scrim (`COLORS.scrim`) in at once. No placeholder, no frame: the scrim waits for the image to be loaded, then the image slides up from the bottom of the screen to the centre.
- A tap on the scrim, or Android's back button, slides the image down and out, then the scrim fades away. A tap on the image does nothing. No zoom, no gesture.
- A tap on the scrim while the image loads fades the scrim away and cancels the slide. A failed load fades the scrim away, no toast; the icon stays and can be tapped again.
- Reduce motion: a fade replaces both slides.
- Size: the screen width minus the gutters, capped at `MAX_CONTENT_WIDTH`, at the 750:1024 ratio; it shrinks to fit when the height is short. Corners are a `Squircle` at `RADIUS.base`.

### Test seams

- The WebP header reader is a pure function, specced on hand-built byte buffers (prior art: `theme-image.service.spec.ts` for the service layer).
- The route is e2e through the Nest testing module built via `bootstrap.ts` (the parser scope and the 413 envelope are part of what it proves), with a fake repository and a fake Storage client (prior art: `admin-curation.e2e-spec.ts`, `app-anecdotes.e2e-spec.ts`).
- Contracts are specced in `packages/contracts` (prior art: `admin/anecdote.spec.ts`, `app/anecdote.spec.ts`).
- Mobile: the overlay size is a pure function under vitest; no component rendering tests. Animations are reviewed on devices by the human.

## Items

```json
[
  {
    "category": "api",
    "description": "An Anecdote carries an optional image path: the admin answers image, the app answers imageUrl",
    "steps": [
      "AnecdoteEntity has a nullable image varchar(255) column, shaped like theme.entity.ts",
      "Admin anecdote response schema carries image: string | null; POST /admin/anecdotes answers image: null",
      "App anecdote schema carries imageUrl: z.url().nullable(); GET /app/anecdotes answers null without an image and the composed anecdote-images public URL with one",
      "Contract specs and the existing anecdote e2e specs pass; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "A pure function reads a WebP header: width, height and animation, or null for anything else",
    "steps": [
      "Specs on hand-built buffers: VP8 lossy, VP8L lossless and VP8X extended each answer their width and height",
      "A VP8X buffer with the animation flag answers animated: true",
      "A non-RIFF buffer, a RIFF that is not WEBP, a truncated header and an empty buffer each answer null",
      "No native dependency added; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "api",
    "description": "PUT /admin/anecdotes/:id/image stores a 750×1024 static WebP of at most 153 600 bytes",
    "steps": [
      "No token: 401; a non-Editor token: 403",
      "Unknown Anecdote: 404",
      "A non-WebP body, an animated WebP, or a WebP other than 750×1024: 400 with a French message",
      "A body above 153 600 bytes: 413, in the ErrorResponse envelope",
      "Success: 200 { id, text, image }, the object uploaded to anecdote-images at <anecdote-id>/<upload-id>.webp with contentType image/webp",
      "A replacement deletes the previous object after the save; a failed deletion still answers 200",
      "A JSON route still refuses a body above 64 kb",
      "e2e through bootstrap.ts with a fake repository and a fake Storage client; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "docs",
    "description": "ADR 0010 records that Anecdote Images transit the API, validated never transformed",
    "steps": [
      "docs/adr/0010 exists in the shape of the other ADRs and states why: no converting client, 150 KiB fits a raw body but not the JSON parser",
      "ADR 0007 covers Theme images alone, rewritten forward-only with no banner",
      "apps/api/AGENTS.md: the JSON-only rule and the service-client rule name the Anecdote Image route, in one compact clause each",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The day set carries imageUrl and the top Anecdote's image is prefetched",
    "steps": [
      "An Anecdote of the day set carries imageUrl from the contract; a stored Anecdote without the field reads as having no image",
      "The top Anecdote's imageUrl is prefetched to the disk cache through expo-image when it becomes the top card; none is prefetched without an image",
      "day-set tests cover a stored Anecdote missing imageUrl; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The Anecdote Image overlay: the scrim fades in, the image slides up once loaded, a scrim tap slides it down",
    "steps": [
      "A pure function sizes the image: screen width minus the gutters, capped at MAX_CONTENT_WIDTH, at 750:1024, shrunk to fit a short height; vitest covers a phone, a short landscape window and a wide web window",
      "A transparent Modal: the scrim (COLORS.scrim) fades in at once, no placeholder; the image slides up from the bottom only once loaded",
      "A scrim tap or Android back slides the image down then fades the scrim; a tap on the image does nothing; no zoom",
      "A scrim tap while loading, or a failed load, fades the scrim away with no toast",
      "Reduce motion: fades replace the slides; corners are a Squircle at RADIUS.base; colours, spacing and radius from the tokens",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The photo icon on the Anecdote card opens the overlay, and is absent without an Anecdote Image",
    "steps": [
      "With an imageUrl: a 20 inkMuted photo icon at the bottom of the right column, under the dismiss cross, a bare Pressable dimmed with PRESSED, accessibility label « Voir l'image » from the feature's constants.ts",
      "Without an imageUrl: no icon rendered",
      "The icon opens the overlay; the peeling copy of a dismissed card stays inert",
      "bun run check green"
    ],
    "passes": true
  }
]
```

## Human steps

- After item 1: `bun run migration:generate`, then run the migration.
- Before any real upload, on the Supabase dashboard SQL editor:

  ```sql
  -- A public bucket for Anecdote Images that accepts only WebP files of at most 150 KiB.
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('anecdote-images', 'anecdote-images', true, 153600, array['image/webp']);
  ```

- After item 3 is deployed on Railway: one real `curl --data-binary @image.webp` with a 750×1024 WebP, then a replacement, and check the old object is gone from the bucket.
- After item 7, on iOS and Android: an Anecdote with an image and one without; the fade, the slide up, the slide down; a tap during a slow load; reduce motion on. Then merge.
