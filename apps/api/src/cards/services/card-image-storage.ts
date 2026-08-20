import { randomUUID } from "node:crypto";
import { type AdminUploadUrlResponse, adminUploadUrlResponseSchema } from "@mentis/contracts/admin";
import { Inject, Injectable } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE } from "../../supabase";

export const CARD_IMAGES_BUCKET = "card-images";

@Injectable()
export class CardImageStorage {
  constructor(@Inject(SUPABASE) private readonly supabase: SupabaseClient) {}

  // ADR 0001: the API only mints the URL — the browser PUTs the processed webp straight to storage.
  async createUploadUrl(): Promise<AdminUploadUrlResponse> {
    const path = `${randomUUID()}.webp`;
    const { data, error } = await this.supabase.storage
      .from(CARD_IMAGES_BUCKET)
      .createSignedUploadUrl(path);
    if (error) {
      throw new Error(`upload url signing failed: ${error.message}`);
    }
    return adminUploadUrlResponseSchema.parse({ path, signedUrl: data.signedUrl });
  }

  // Dropping a de-referenced object keeps the bucket free of orphans no row points at.
  async remove(paths: string[]): Promise<void> {
    if (paths.length === 0) {
      return;
    }
    const { error } = await this.supabase.storage.from(CARD_IMAGES_BUCKET).remove(paths);
    if (error) {
      throw new Error(`Card Images removal failed: ${error.message}`);
    }
  }
}
