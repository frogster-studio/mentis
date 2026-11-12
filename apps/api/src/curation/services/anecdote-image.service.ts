import { randomUUID } from "node:crypto";
import { type AdminAnecdoteResponse, adminAnecdoteResponseSchema } from "@mentis/contracts/admin";
import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE } from "../../_config/supabase.config";
import { ANECDOTE_IMAGES_BUCKET } from "../../catalog/utils/anecdote-image-url";
import { CurationRepository } from "../repositories/curation.repository";
import { readWebpHeader } from "../utils/read-webp-header";

const ANECDOTE_IMAGE_WIDTH = 750;
const ANECDOTE_IMAGE_HEIGHT = 1024;

@Injectable()
export class AnecdoteImageService {
  constructor(
    @Inject(SUPABASE) private readonly supabase: SupabaseClient,
    private readonly repository: CurationRepository,
  ) {}

  async replaceAnecdoteImage(id: string, file: unknown): Promise<AdminAnecdoteResponse> {
    this.refuseUnfinishedFile(file);
    const stored = await this.repository.findAnecdote(id);
    if (stored === null) throw new NotFoundException("Anecdote introuvable.");
    const bucket = this.supabase.storage.from(ANECDOTE_IMAGES_BUCKET);
    // A fresh path per upload, so the CDN never serves the replaced image.
    const path = `${id}/${randomUUID()}.webp`;
    const { error } = await bucket.upload(path, file, { contentType: "image/webp" });
    if (error) throw new BadGatewayException("Impossible d’enregistrer l’image. Réessayez.");
    const updated = await this.repository.updateAnecdote({ id, image: path });
    if (updated === null) throw new NotFoundException("Anecdote introuvable.");
    if (stored.image !== null) {
      // The reference has already moved, so a failed deletion only orphans the previous object.
      await bucket.remove([stored.image]).catch(() => undefined);
    }
    return adminAnecdoteResponseSchema.parse(updated);
  }

  // The API stores the file as sent, so anything but the finished format is refused.
  private refuseUnfinishedFile(file: unknown): asserts file is Buffer {
    const header = Buffer.isBuffer(file) ? readWebpHeader(file) : null;
    if (header === null) throw new BadRequestException("L’image doit être un fichier WebP.");
    if (header.animated) throw new BadRequestException("L’image ne doit pas être animée.");
    if (header.width !== ANECDOTE_IMAGE_WIDTH || header.height !== ANECDOTE_IMAGE_HEIGHT) {
      throw new BadRequestException(
        `L’image doit mesurer ${ANECDOTE_IMAGE_WIDTH} × ${ANECDOTE_IMAGE_HEIGHT} px.`,
      );
    }
  }
}
