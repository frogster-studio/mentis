# Browser-only image processing

Card Images are validated, resized (longest side capped at 1920px), compressed, and converted to webp (quality ~80) entirely in the browser at save time, then uploaded directly to Supabase Storage. No server-side processing exists, and original files are never stored.

We require uploads with no file-size limit, but the app deploys to Vercel, whose serverless functions reject request bodies over ~4.5MB — so routing image bytes through the API was never viable. The alternative (upload originals to Supabase Storage, rework server-side with sharp) offers better compression and keeps originals, but adds moving parts and can still fail on huge files. We deliberately chose the simpler path.

## Consequences

- Originals are unrecoverable: if we ever want higher-resolution or re-encoded variants, images must be re-uploaded from source.
- Compression quality is bounded by the browser's webp encoder, slightly worse than server-grade libwebp tuning.
- Per-image failures (encoding or upload) are handled in the form UI and are ephemeral — nothing about a failed image is persisted.
