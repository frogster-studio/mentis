import { randomUUID } from "node:crypto";
import {
  type AdminThemeImageUploadResponse,
  adminThemeImageUploadResponseSchema,
} from "@mentis/contracts/admin";
import { Inject, Injectable } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE } from "../../_config/supabase.config";
import { THEME_IMAGES_BUCKET } from "../../catalog/utils/theme-image-url";

@Injectable()
export class ThemeImageService {
  constructor(@Inject(SUPABASE) private readonly supabase: SupabaseClient) {}

  // ADR 0007: signing is the API's whole part in an upload — no image byte ever reaches it.
  async createUploadUrl(): Promise<AdminThemeImageUploadResponse> {
    const path = `${randomUUID()}.webp`;
    const { data, error } = await this.supabase.storage
      .from(THEME_IMAGES_BUCKET)
      .createSignedUploadUrl(path);
    if (error) {
      throw new Error(`Theme image upload signing failed: ${error.message}`);
    }
    return adminThemeImageUploadResponseSchema.parse({ path, signedUrl: data.signedUrl });
  }
}
