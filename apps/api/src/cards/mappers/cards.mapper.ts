import {
  type AdminCardListResponse,
  type AdminCardResponse,
  adminCardListResponseSchema,
  adminCardResponseSchema,
} from "@mentis/contracts/admin";
import type { CardEntity } from "../../_database/entities/card.entity";

const wireCard = (card: CardEntity) => ({
  id: card.id,
  type: card.type,
  title: card.title,
  tags: card.tags,
  payload: card.payload,
  images: card.images,
  postedOn: card.postedOn,
  createdAt: card.createdAt.toISOString(),
  updatedAt: card.updatedAt.toISOString(),
});

export const toAdminCardResponse = (card: CardEntity): AdminCardResponse =>
  adminCardResponseSchema.parse(wireCard(card));

export const toAdminCardListResponse = (
  items: CardEntity[],
  total: number,
  page: number,
  pageSize: number,
): AdminCardListResponse =>
  adminCardListResponseSchema.parse({ items: items.map(wireCard), total, page, pageSize });
