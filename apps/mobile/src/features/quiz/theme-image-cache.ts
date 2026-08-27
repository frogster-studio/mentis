import { Image } from "expo-image";

// The Reveal renders from the very cache the Draw warms, so both sides must name the same one.
export const THEME_IMAGE_CACHE_POLICY = "disk";

export function prefetchThemeImages(imageUrls: string[]): void {
  void Image.prefetch(imageUrls, { cachePolicy: THEME_IMAGE_CACHE_POLICY });
}
