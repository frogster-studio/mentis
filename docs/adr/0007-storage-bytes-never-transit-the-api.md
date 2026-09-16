# Storage bytes never transit the API

`apps/api` is the sole database and storage gateway, with one deliberate bend: image bytes never pass through it. The browser validates a Theme image locally and converts JPEG/PNG to lossless WebP in a worker without resizing. Existing WebP files stay unchanged. The curation surface mints a signed upload URL for the `theme-images` bucket; the browser PUTs the file straight to Supabase Storage, and public reads stay on the CDN. "Storage writes go through the API" therefore means the API is the sole authorizer of write access, not the byte conduit.

Routing bytes through the API would collide with its JSON-only 64 kb body cap and re-introduce the ~4.5 MB Vercel body cap on the admin BFF hop. Validation and conversion already happen in the browser before upload.

## Image replacement and reset

Selecting a file creates a local preview. SAVE validates again and uploads to `<theme-id>/<upload-id>/<immutable-theme-slug>.webp`. Fresh folders prevent overwriting an image that is still associated with a Theme and avoid stale CDN responses. The API signs an authorization binding the upload to its Theme and previous image/version, checks Storage metadata, and saves the reference through TypeORM with a row lock and an optimistic version check.

Every new Theme starts with `default.webp` unless its initial custom upload succeeds. Reset switches the reference to `default.webp`. The API never deletes that object. Custom images are deleted only after the new reference is persisted and only if no Theme still references them.

Postgres and Storage cannot share a transaction. If deletion fails after persistence, the new/default image remains associated. The response carries a signed cleanup token; the admin retains pending tokens in local storage and offers an explicit retry, including after a page reload. Cleanup always rechecks references. A lost replacement response is reconciled against the catalog before the browser reports failure.

## Consequences

- The API never sees image content. Browser validation checks extensions, MIME types, file signatures, dimensions (each at least 700 px) and input size (at most 2 MiB). The bucket accepts only `image/webp`; the API checks the stored MIME type and size before persisting a new reference.
- Lossless conversion can increase file size. Output above 2 MiB is refused; there is no automatic resizing or quality reduction.
- The codec is `@jsquash/webp`, loaded in a worker only when conversion is needed. SAVE transfers the already validated bitmap to the worker without another decode. Encoding tries low-effort lossless settings first, then the denser lossless settings only if the output exceeds 2 MiB. Neither pass reduces pixel quality. Its WASM assets are copied from the installed dependency by the admin's dev/build scripts.
- A failed database save or a browser closing after upload can leave an unreferenced WebP. These objects are deliberately not deleted after an ambiguous write response, since that could remove a committed image. There is no background orphan collector.
- Cleanup retries live in the originating browser. Clearing its storage, losing a reset response, or rotating the signing secret can require manual cleanup of an unreferenced object. Associated images remain valid.
- Existing object paths remain readable; images acquire slug-based paths when replaced. No database migration or bulk rewrite of catalog images is required.
- If the API ever needs to inspect or transform image bytes server-side, this ADR reopens.
