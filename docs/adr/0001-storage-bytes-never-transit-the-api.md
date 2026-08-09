# Storage bytes never transit the API

`apps/api` is the sole database and storage gateway, with one deliberate bend: image bytes never pass through it. The API only mints signed upload URLs (`POST /admin/card-images/upload-url`); the browser PUTs the processed webp straight to Supabase Storage, and public reads stay on the CDN. "Storage writes go through the API" therefore means the API is the sole *authorizer* of write access, not the byte conduit.

Routing bytes through the API would re-introduce the ~4.5MB Vercel body cap on the admin BFF hop — the exact constraint [ADR 0001 of the curation context](../../apps/admin/docs/adr/0001-browser-only-image-processing.md) was written to dodge — and would buy nothing, since images are already validated, resized, and webp-encoded in the browser before upload.

## Consequences

- The API never sees image content; upload-time enforcement is the bucket's `image/webp` restriction plus the signed URL's scope and TTL.
- If the API ever needs to inspect or transform image bytes server-side, this ADR reopens together with the browser-only processing ADR it extends.
