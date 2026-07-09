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
