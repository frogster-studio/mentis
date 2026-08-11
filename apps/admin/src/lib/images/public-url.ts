import { supabaseProject } from "@/lib/supabase";

const CARD_IMAGES_BUCKET = "card-images";

// The bucket is public-read, so the URL is derived locally — no client, no request.
export function cardImagePublicUrl(path: string): string {
  return `${supabaseProject().url}/storage/v1/object/public/${CARD_IMAGES_BUCKET}/${path}`;
}
