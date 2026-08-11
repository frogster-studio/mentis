import type { SupabaseClient } from "@supabase/supabase-js";

export const CARD_IMAGES_BUCKET = "card-images";

// Dropping a de-referenced object keeps the bucket free of orphans no row points at.
export const removeCardImages = async (client: SupabaseClient, paths: string[]): Promise<void> => {
  if (paths.length === 0) {
    return;
  }
  const { error } = await client.storage.from(CARD_IMAGES_BUCKET).remove(paths);
  if (error) {
    throw new Error(`Card Images removal failed: ${error.message}`);
  }
};
