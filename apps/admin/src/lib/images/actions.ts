"use server";

import { requireSession } from "@/lib/auth/require-session";
import { CARD_IMAGES_BUCKET } from "@/lib/images/storage";
import { createServiceClient } from "@/lib/supabase";

// Mints a signed URL so the browser can PUT one processed webp straight into
// the bucket — image bytes never travel through the app server (ADR 0001).
export async function createCardImageUpload(): Promise<{
  path: string;
  url: string;
}> {
  await requireSession();

  const path = `${crypto.randomUUID()}.webp`;
  const { data, error } = await createServiceClient()
    .storage.from(CARD_IMAGES_BUCKET)
    .createSignedUploadUrl(path);
  if (error) {
    throw new Error(`Failed to sign the Image upload: ${error.message}`);
  }
  return { path, url: data.signedUrl };
}
