import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  type AdminThemeImageConfig,
  type AdminThemeImageUpload,
  type AdminThemeImageUploadResponse,
  type AdminThemeWrite,
  adminThemeImageConfigSchema,
  adminThemeImageUploadResponseSchema,
  DEFAULT_THEME_IMAGE,
} from "@mentis/contracts/admin";
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ENV, type Env } from "../../_config/env.config";
import { SUPABASE } from "../../_config/supabase.config";
import { ThemeEntity } from "../../_database/entities/theme.entity";
import { THEME_IMAGES_BUCKET } from "../../catalog/utils/theme-image-url";
import { CurationRepository } from "../repositories/curation.repository";
import { slugify } from "../utils/slugify";

type ImageAuthorization = {
  id: string;
  slug: string;
  path: string;
  previousImage: string;
  previousUpdatedAt?: string;
  expiresAt: number;
};

@Injectable()
export class ThemeImageService {
  constructor(
    @Inject(SUPABASE) private readonly supabase: SupabaseClient,
    @Inject(ENV) private readonly env: Env,
    private readonly repository: CurationRepository,
  ) {}

  config(): AdminThemeImageConfig {
    return adminThemeImageConfigSchema.parse({
      publicBaseUrl: `${this.env.SUPABASE_URL}/storage/v1/object/public/${THEME_IMAGES_BUCKET}/`,
    });
  }

  async createUploadUrl(input: AdminThemeImageUpload): Promise<AdminThemeImageUploadResponse> {
    const stored = input.themeId ? await this.repository.findTheme(input.themeId) : null;
    if (input.themeId && !stored) throw new NotFoundException("Thème introuvable.");
    const previousImage = stored?.image ?? DEFAULT_THEME_IMAGE;
    if (previousImage !== input.expectedImage)
      throw new ConflictException("L’image a changé. Rechargez le thème.");
    const id = stored?.id ?? randomUUID();
    const slug = stored?.slug ?? slugify(input.name);
    if (!slug) throw new BadRequestException("Le nom doit contenir une lettre ou un chiffre.");
    const path = `${id}/${randomUUID()}/${slug}.webp`;
    if (path.length > 255)
      throw new BadRequestException("Le nom du thème est trop long pour son image.");
    const { data, error } = await this.supabase.storage
      .from(THEME_IMAGES_BUCKET)
      .createSignedUploadUrl(path);
    if (error)
      throw new BadRequestException("Impossible de préparer l’import de l’image. Réessayez.");
    return adminThemeImageUploadResponseSchema.parse({
      path,
      signedUrl: data.signedUrl,
      token: this.sign({
        id,
        slug,
        path,
        previousImage,
        previousUpdatedAt: stored?.updatedAt?.toISOString(),
        expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      }),
    });
  }

  async authorize(theme: AdminThemeWrite, stored?: ThemeEntity): Promise<string | undefined> {
    if (theme.image === DEFAULT_THEME_IMAGE || theme.image === stored?.image) return undefined;
    const authorization = this.read(theme.imageUploadToken ?? "");
    if (
      authorization.path !== theme.image ||
      authorization.expiresAt < Date.now() ||
      (stored
        ? authorization.id !== stored.id ||
          authorization.slug !== stored.slug ||
          authorization.previousImage !== stored.image ||
          authorization.previousUpdatedAt !== stored.updatedAt?.toISOString()
        : authorization.slug !== slugify(theme.name) ||
          authorization.previousImage !== DEFAULT_THEME_IMAGE)
    )
      throw new ConflictException("Cet import n’est plus valide. Sélectionnez à nouveau l’image.");
    const { data, error } = await this.supabase.storage.from(THEME_IMAGES_BUCKET).info(theme.image);
    if (
      error ||
      data?.metadata?.mimetype !== "image/webp" ||
      !(data.metadata.size > 0) ||
      data.metadata.size > 2 * 1024 * 1024
    ) {
      throw new BadRequestException(
        "L’image WebP n’a pas été importée correctement (2 Mo maximum).",
      );
    }
    return authorization.id;
  }

  async cleanupAfterSave(stored: ThemeEntity, previousImage: string): Promise<string | undefined> {
    if (previousImage === stored.image || this.isDefault(previousImage)) return undefined;
    const token = this.sign({
      id: stored.id,
      slug: stored.slug,
      path: stored.image,
      previousImage,
      expiresAt: 0,
    });
    try {
      await this.cleanup(token);
      return undefined;
    } catch {
      return token;
    }
  }

  async cleanup(token: string): Promise<void> {
    const { previousImage } = this.read(token);
    if (this.isDefault(previousImage))
      throw new BadRequestException("L’image par défaut ne peut pas être supprimée.");
    if (await this.repository.isImageReferenced({ image: previousImage })) {
      throw new ConflictException("Cette image est encore utilisée par un thème.");
    }
    const { error } = await this.supabase.storage.from(THEME_IMAGES_BUCKET).remove([previousImage]);
    if (error)
      throw new BadRequestException(
        "Image enregistrée, mais l’ancienne image n’a pas pu être supprimée. Réessayez le nettoyage.",
      );
  }

  private isDefault(path: string): boolean {
    return path === DEFAULT_THEME_IMAGE;
  }

  private sign(payload: ImageAuthorization): string {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${body}.${this.signature(body).toString("base64url")}`;
  }

  private signature(body: string): Buffer {
    return createHmac("sha256", this.env.SUPABASE_SECRET_KEY)
      .update(`theme-image:${body}`)
      .digest();
  }

  private read(token: string): ImageAuthorization {
    try {
      const [body, signature, extra] = token.split(".");
      const actual = Buffer.from(signature, "base64url");
      const expected = this.signature(body);
      if (extra || actual.length !== expected.length || !timingSafeEqual(actual, expected))
        throw new Error();
      return JSON.parse(Buffer.from(body, "base64url").toString()) as ImageAuthorization;
    } catch {
      throw new BadRequestException("Autorisation d’image invalide.");
    }
  }
}
