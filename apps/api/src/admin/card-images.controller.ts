import { randomUUID } from "node:crypto";
import { type AdminUploadUrlResponse, adminUploadUrlResponseSchema } from "@mentis/contracts/admin";
import { Controller, HttpCode, HttpStatus, Inject, Post, UseGuards } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EditorGuard } from "../auth/editor.guard";
import { AuthenticatedThrottlerGuard } from "../common/rate-limit.guard";
import { SUPABASE } from "../supabase";
import { CARD_IMAGES_BUCKET } from "./card-image-storage";

@Controller("admin/card-images")
@UseGuards(EditorGuard, AuthenticatedThrottlerGuard)
export class CardImagesController {
  constructor(@Inject(SUPABASE) private readonly supabase: SupabaseClient) {}

  // ADR 0001: the API only mints the URL — the browser PUTs the processed webp straight to storage.
  @Post("upload-url")
  @HttpCode(HttpStatus.OK)
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
}
