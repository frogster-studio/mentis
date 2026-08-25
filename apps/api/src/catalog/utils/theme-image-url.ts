export const THEME_IMAGES_BUCKET = "theme-images";

// The bucket is public-read (ADR 0001), so the URL is composed here rather than requested.
export const themeImageUrl = (supabaseUrl: string, path: string): string =>
  `${supabaseUrl}/storage/v1/object/public/${THEME_IMAGES_BUCKET}/${path}`;
