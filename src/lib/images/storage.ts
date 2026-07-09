import type { SupabaseClient } from "@supabase/supabase-js";

export const CARD_IMAGES_BUCKET = "card-images";

// The bucket is public-read, so the URL is derived locally — no request.
export function cardImagePublicUrl(
  client: SupabaseClient,
  path: string,
): string {
  return client.storage.from(CARD_IMAGES_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

// Removing an Image from a Card must also drop its object, or the bucket
// accumulates orphans no row references.
export async function removeCardImages(
  client: SupabaseClient,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await client.storage.from(CARD_IMAGES_BUCKET).remove(paths);
  if (error) {
    throw new Error(`Failed to remove Card Images: ${error.message}`);
  }
}
