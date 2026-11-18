# Theme image bytes never transit the API

`apps/api` is the sole database and storage gateway, yet Theme image bytes never pass through it. The browser checks a Theme image against the admin image rule and uploads it exactly as dropped: nothing converts, resizes or re-encodes it. The curation surface mints a signed upload URL for the `theme-images` bucket; the browser PUTs the file straight to Supabase Storage, and public reads stay on the CDN. For Theme images, "storage writes go through the API" therefore means the API is the sole authorizer of write access, not the byte conduit.

Routing bytes through the API would collide with its JSON-only 64 kb body cap and re-introduce the ~4.5 MB Vercel body cap on the admin BFF hop. Validation already happens in the browser before upload.

## Image replacement and reset

Dropping a file checks it against the rule and creates a local preview. SAVE uploads it as dropped to `<theme-id>/<upload-id>/<immutable-theme-slug>.webp`. Fresh folders prevent overwriting an image that is still associated with a Theme and avoid stale CDN responses. The API signs an authorization binding the upload to its Theme and previous image/version, checks Storage metadata, and saves the reference through TypeORM with a row lock and an optimistic version check.

Every new Theme starts with `default.webp` unless its initial custom upload succeeds. Reset switches the reference to `default.webp`. The API never deletes that object. Custom images are deleted only after the new reference is persisted and only if no Theme still references them.

Postgres and Storage cannot share a transaction. If deletion fails after persistence, the new/default image remains associated. The response carries a signed cleanup token; the admin retains pending tokens in local storage and offers an explicit retry, including after a page reload. Cleanup always rechecks references. A lost replacement response is reconciled against the catalog before the browser reports failure.

## Consequences

- The API never sees Theme image content. The browser enforces the admin image rule it shares with the Anecdote Image screen: extension, MIME type and WebP signature agree, the VP8X animation flag is unset, the header reads exactly 750 × 1024 px, and the file holds at most 204 800 bytes. A JPEG or PNG is refused, never converted. The bucket accepts only `image/webp`; the API checks the stored MIME type and size before persisting a new reference.
- The API and the bucket cap a Theme image at 2 MiB, not 204 800 bytes, so legacy Theme images of any ratio stay valid. The rule lives in the browser alone: a signed upload that skips it still lands if it is a WebP within 2 MiB.
- A failed database save or a browser closing after upload can leave an unreferenced WebP. These objects are deliberately not deleted after an ambiguous write response, since that could remove a committed image. There is no background orphan collector.
- Cleanup retries live in the originating browser. Clearing its storage, losing a reset response, or rotating the signing secret can require manual cleanup of an unreferenced object. Associated images remain valid.
- Existing object paths remain readable; images acquire slug-based paths when replaced. No database migration or bulk rewrite of catalog images is required.
- If the API ever needs to inspect or transform Theme image bytes server-side, this ADR reopens.
