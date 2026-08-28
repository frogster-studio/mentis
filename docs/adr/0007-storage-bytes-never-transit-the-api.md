# Storage bytes never transit the API

`apps/api` is the sole database and storage gateway, with one deliberate bend: image bytes never pass through it. The browser validates, resizes and webp-encodes a Theme image locally; the curation surface only mints a signed upload URL for the `theme-images` bucket, the browser PUTs the processed file straight to Supabase Storage, and public reads stay on the CDN. "Storage writes go through the API" therefore means the API is the sole *authorizer* of write access, not the byte conduit.

Routing bytes through the API would collide with its JSON-only 64 kb body cap and re-introduce the ~4.5 MB Vercel body cap on the admin BFF hop — and would buy nothing, since the image is already validated, resized and encoded in the browser before upload.

## Consequences

- The API never sees image content; upload-time enforcement is the bucket's mime restriction plus the signed URL's scope and TTL.
- If the API ever needs to inspect or transform image bytes server-side, this ADR reopens.
