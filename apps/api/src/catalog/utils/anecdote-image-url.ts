export const ANECDOTE_IMAGES_BUCKET = "anecdote-images";

// The bucket is public-read, so the URL is composed here rather than requested.
export const anecdoteImageUrl = (supabaseUrl: string, path: string): string =>
  `${supabaseUrl}/storage/v1/object/public/${ANECDOTE_IMAGES_BUCKET}/${path}`;
