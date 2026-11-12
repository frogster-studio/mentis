# Anecdote Images transit the API, validated never transformed

The Editor sets or replaces an Anecdote Image in one call, `PUT /admin/anecdotes/:id/image`, with the finished file as the raw body. The API reads the format, the dimensions and the animation flag from the file's own WebP header, never from `Content-Type` and without a native dependency, and stores exactly the bytes it received: a static WebP, lossy or lossless, exactly 750×1024 px and at most 153 600 bytes. Anything else is refused, never converted. The object lands in the public `anecdote-images` bucket at a fresh `<anecdote-id>/<upload-id>.webp`, so the CDN never serves a stale image. The API saves the reference through TypeORM and only then deletes the previous object.

Theme images skip the API ([ADR 0007](0007-theme-image-bytes-never-transit-the-api.md)) because a browser validates and converts them before a signed upload. No client converts an Anecdote Image: the dashboard has no screen for it, and the caller sends a finished file. 150 KiB fits a raw body but not the JSON parser's 64 kb cap, so a raw parser is scoped to this one route and every other route keeps JSON only. We rejected a signed upload URL, which costs two calls and a metadata check for a caller that can send the bytes in one. We rejected base64 inside JSON, which inflates the file by a third and would raise the cap on every route. We rejected server-side conversion with `sharp`, which puts a native dependency in the image and hides a wrong source file behind a transform.

## Consequences

- The caller owns the encoding: 100 KiB is its target, not an API rule. The bucket's own limits (`image/webp`, 153 600 bytes) repeat the API's as a second lock.
- The route path lives twice, in the controller decorator and in the `CurationModule` middleware that scopes the raw parser; the e2e proves the two agree.
- A failed deletion still answers 200, and a failed save leaves the fresh object behind. Both orphans are accepted: there is no cleanup token and no orphan collector.
- A failed upload answers 502: the failure is upstream, not the caller's fault.
- No route removes an image: a replacement corrects a wrong one.
- If the dashboard ever gains an Anecdote Image screen that converts in the browser, this ADR reopens toward ADR 0007's signed uploads.
