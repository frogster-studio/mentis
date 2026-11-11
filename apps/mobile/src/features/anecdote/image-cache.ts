import { Image } from "expo-image";

// The overlay renders from the very cache the top card warms, so both sides must name the same one.
export const ANECDOTE_IMAGE_CACHE_POLICY = "disk";

export function prefetchAnecdoteImage(imageUrl: string): void {
  void Image.prefetch(imageUrl, { cachePolicy: ANECDOTE_IMAGE_CACHE_POLICY });
}
