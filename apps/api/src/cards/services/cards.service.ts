import {
  type AdminCardListQuery,
  type AdminCardListResponse,
  type AdminCardPostedInput,
  type AdminCardResponse,
  type AdminCardWriteInput,
  adminCardIdSchema,
} from "@mentis/contracts/admin";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { toAdminCardListResponse, toAdminCardResponse } from "../mappers/cards.mapper";
import { type CardContent, CardsRepository } from "../repositories/cards.repository";
import { CardImageStorage } from "./card-image-storage";

export const CARD_LIST_PAGE_SIZE = 20;

const cardNotFound = (): NotFoundException => new NotFoundException("Card not found");

// A malformed id is indistinguishable from an unknown Card on the wire.
const requireCardId = (id: string): string => {
  if (!adminCardIdSchema.safeParse(id).success) {
    throw cardNotFound();
  }
  return id;
};

const toContent = (input: AdminCardWriteInput): CardContent => ({
  type: input.type,
  title: input.title,
  tags: input.tags,
  payload: input.payload,
  images: input.images,
});

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);

  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly cardImageStorage: CardImageStorage,
  ) {}

  async list(query: AdminCardListQuery): Promise<AdminCardListResponse> {
    const { items, total } = await this.cardsRepository.list(
      {
        search: query.search === undefined || query.search === "" ? undefined : query.search,
        type: query.type,
        tag: query.tag === undefined || query.tag === "" ? undefined : query.tag,
      },
      query.page,
      CARD_LIST_PAGE_SIZE,
    );
    return toAdminCardListResponse(items, total, query.page, CARD_LIST_PAGE_SIZE);
  }

  async create(input: AdminCardWriteInput): Promise<AdminCardResponse> {
    return toAdminCardResponse(await this.cardsRepository.create(toContent(input)));
  }

  async get(id: string): Promise<AdminCardResponse> {
    const card = await this.cardsRepository.findById(requireCardId(id));
    if (card === null) {
      throw cardNotFound();
    }
    return toAdminCardResponse(card);
  }

  async replace(id: string, input: AdminCardWriteInput): Promise<AdminCardResponse> {
    const cardId = requireCardId(id);
    const storedPaths = await this.cardsRepository.imagePaths(cardId);
    if (storedPaths === null) {
      throw cardNotFound();
    }
    const updated = await this.cardsRepository.replace(cardId, toContent(input));
    if (updated === null) {
      throw cardNotFound();
    }
    await this.dropDereferencedImages(storedPaths, input.images);
    return toAdminCardResponse(updated);
  }

  async setPosted(id: string, input: AdminCardPostedInput): Promise<AdminCardResponse> {
    const updated = await this.cardsRepository.setPosted(requireCardId(id), input.postedOn);
    if (updated === null) {
      throw cardNotFound();
    }
    return toAdminCardResponse(updated);
  }

  // The row goes first, so a storage failure afterwards can never resurrect the Card.
  async remove(id: string): Promise<void> {
    const removed = await this.cardsRepository.remove(requireCardId(id));
    if (removed === null) {
      throw cardNotFound();
    }
    await this.cardImageStorage.remove(removed.imagePaths);
  }

  // Cleanup runs only once the save has landed, and its failure must never fail that save.
  private async dropDereferencedImages(
    storedPaths: string[],
    kept: { path: string }[],
  ): Promise<void> {
    const keptPaths = new Set(kept.map((image) => image.path));
    try {
      await this.cardImageStorage.remove(storedPaths.filter((path) => !keptPaths.has(path)));
    } catch (error) {
      this.logger.error("Card Images cleanup failed", error);
    }
  }
}
