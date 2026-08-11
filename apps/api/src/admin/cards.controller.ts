import {
  type AdminCardListQuery,
  type AdminCardListResponse,
  type AdminCardPostedInput,
  type AdminCardResponse,
  type AdminCardWriteInput,
  adminCardIdSchema,
  adminCardListQuerySchema,
  adminCardListResponseSchema,
  adminCardPostedInputSchema,
  adminCardResponseSchema,
  adminCardWriteInputSchema,
} from "@mentis/contracts/admin";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EditorGuard } from "../auth/editor.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SUPABASE } from "../supabase";
import { removeCardImages } from "./card-image-storage";

const CARD_SELECT =
  "id, type, title, tags, payload, images, postedOn:posted_on, createdAt:created_at, updatedAt:updated_at";

export const CARD_LIST_PAGE_SIZE = 20;

type StoredImages = { images: { path: string }[] | null };

const cardNotFound = (): NotFoundException => new NotFoundException("Card not found");

// A malformed id is indistinguishable from an unknown Card on the wire.
const requireCardId = (id: string): string => {
  if (!adminCardIdSchema.safeParse(id).success) {
    throw cardNotFound();
  }
  return id;
};

// % and _ are LIKE wildcards; escaping them makes a search for "100%" match those literal characters.
const escapeLikePattern = (term: string): string => term.replace(/[\\%_]/g, (char) => `\\${char}`);

const toRow = (input: AdminCardWriteInput) => ({
  type: input.type,
  title: input.title,
  tags: input.tags,
  payload: input.payload,
  images: input.images,
});

const imagePaths = (rows: StoredImages[]): string[] =>
  rows.flatMap((row) => (row.images ?? []).map((image) => image.path));

@Controller("admin/cards")
@UseGuards(EditorGuard)
export class CardsController {
  private readonly logger = new Logger(CardsController.name);

  constructor(@Inject(SUPABASE) private readonly supabase: SupabaseClient) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(adminCardListQuerySchema)) query: AdminCardListQuery,
  ): Promise<AdminCardListResponse> {
    let builder = this.supabase.from("cards").select(CARD_SELECT, { count: "exact" });
    if (query.search !== undefined && query.search !== "") {
      builder = builder.ilike("title", `%${escapeLikePattern(query.search)}%`);
    }
    if (query.type !== undefined) {
      builder = builder.eq("type", query.type);
    }
    if (query.tag !== undefined && query.tag !== "") {
      builder = builder.contains("tags", [query.tag]);
    }

    const offset = (query.page - 1) * CARD_LIST_PAGE_SIZE;
    const { data, count, error } = await builder
      .order("updated_at", { ascending: false })
      .range(offset, offset + CARD_LIST_PAGE_SIZE - 1);
    if (error) {
      throw new Error(`cards select failed: ${error.message}`);
    }
    return adminCardListResponseSchema.parse({
      items: data ?? [],
      total: count ?? 0,
      page: query.page,
      pageSize: CARD_LIST_PAGE_SIZE,
    });
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(adminCardWriteInputSchema)) input: AdminCardWriteInput,
  ): Promise<AdminCardResponse> {
    const { data, error } = await this.supabase
      .from("cards")
      .insert(toRow(input))
      .select(CARD_SELECT)
      .single();
    if (error) {
      throw new Error(`card insert failed: ${error.message}`);
    }
    return adminCardResponseSchema.parse(data);
  }

  @Get(":id")
  async get(@Param("id") id: string): Promise<AdminCardResponse> {
    const { data, error } = await this.supabase
      .from("cards")
      .select(CARD_SELECT)
      .eq("id", requireCardId(id))
      .maybeSingle();
    if (error) {
      throw new Error(`card select failed: ${error.message}`);
    }
    if (data === null) {
      throw cardNotFound();
    }
    return adminCardResponseSchema.parse(data);
  }

  @Put(":id")
  async replace(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(adminCardWriteInputSchema)) input: AdminCardWriteInput,
  ): Promise<AdminCardResponse> {
    const cardId = requireCardId(id);
    const storedPaths = await this.storedImagePaths(cardId);
    const { data, error } = await this.supabase
      .from("cards")
      .update(toRow(input))
      .eq("id", cardId)
      .select(CARD_SELECT)
      .maybeSingle();
    if (error) {
      throw new Error(`card update failed: ${error.message}`);
    }
    if (data === null) {
      throw cardNotFound();
    }
    await this.dropDereferencedImages(storedPaths, input.images);
    return adminCardResponseSchema.parse(data);
  }

  @Patch(":id/posted")
  async setPosted(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(adminCardPostedInputSchema)) input: AdminCardPostedInput,
  ): Promise<AdminCardResponse> {
    // The set_updated_at trigger ignores a posted_on-only write, so marking never reorders the library.
    const { data, error } = await this.supabase
      .from("cards")
      .update({ posted_on: input.postedOn })
      .eq("id", requireCardId(id))
      .select(CARD_SELECT)
      .maybeSingle();
    if (error) {
      throw new Error(`posted marks update failed: ${error.message}`);
    }
    if (data === null) {
      throw cardNotFound();
    }
    return adminCardResponseSchema.parse(data);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string): Promise<void> {
    // The row goes first, so a storage failure afterwards can never resurrect the Card.
    const { data, error } = await this.supabase
      .from("cards")
      .delete()
      .eq("id", requireCardId(id))
      .select("images");
    if (error) {
      throw new Error(`card delete failed: ${error.message}`);
    }
    const deleted = (data ?? []) as StoredImages[];
    if (deleted.length === 0) {
      throw cardNotFound();
    }
    await removeCardImages(this.supabase, imagePaths(deleted));
  }

  private async storedImagePaths(id: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("cards")
      .select("images")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      throw new Error(`card images select failed: ${error.message}`);
    }
    if (data === null) {
      throw cardNotFound();
    }
    return imagePaths([data as StoredImages]);
  }

  // Cleanup runs only once the save has landed, and its failure must never fail that save.
  private async dropDereferencedImages(
    storedPaths: string[],
    kept: { path: string }[],
  ): Promise<void> {
    const keptPaths = new Set(kept.map((image) => image.path));
    try {
      await removeCardImages(
        this.supabase,
        storedPaths.filter((path) => !keptPaths.has(path)),
      );
    } catch (error) {
      this.logger.error("Card Images cleanup failed", error);
    }
  }
}
