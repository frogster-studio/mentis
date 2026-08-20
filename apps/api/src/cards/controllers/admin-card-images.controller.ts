import type { AdminUploadUrlResponse } from "@mentis/contracts/admin";
import { Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { EditorGuard } from "../../auth/editor.guard";
import { AuthenticatedThrottlerGuard } from "../../common/rate-limit.guard";
import { CardImageStorage } from "../services/card-image-storage";

@Controller("admin/card-images")
@UseGuards(EditorGuard, AuthenticatedThrottlerGuard)
export class AdminCardImagesController {
  constructor(private readonly cardImageStorage: CardImageStorage) {}

  @Post("upload-url")
  @HttpCode(HttpStatus.OK)
  createUploadUrl(): Promise<AdminUploadUrlResponse> {
    return this.cardImageStorage.createUploadUrl();
  }
}
