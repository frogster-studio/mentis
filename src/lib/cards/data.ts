import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type Card,
  type CardData,
  type CardType,
  cardSchema,
  normalizeTag,
  postedOnSchema,
  type Social,
} from "@/lib/cards/schema";
import { removeCardImages } from "@/lib/images/storage";

type CardRow = {
  id: string;
  type: string;
  title: string;
  tags: string[];
  posted_on: unknown;
  payload: unknown;
  images: unknown;
  created_at: string;
  updated_at: string;
};

// Rows are re-validated against the card schema on the way out, so a Card
// handed to the UI is always well-formed.
function rowToCard(row: CardRow): Card {
  const data = cardSchema.parse({
    type: row.type,
    title: row.title,
    tags: row.tags,
    payload: row.payload,
    images: row.images,
  });
  return {
    ...data,
    id: row.id,
    postedOn: postedOnSchema.parse(row.posted_on),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function insertCard(
  client: SupabaseClient,
  data: CardData,
): Promise<Card> {
  const { data: row, error } = await client
    .from("cards")
    .insert({
      type: data.type,
      title: data.title,
      tags: data.tags,
      payload: data.payload,
      images: data.images,
    })
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to create Card: ${error.message}`);
  }
  return rowToCard(row as CardRow);
}

export const CARD_LIST_PAGE_SIZE = 20;

export type CardListOptions = {
  search?: string;
  type?: CardType;
  tag?: string;
  page?: number;
  pageSize?: number;
};

export type CardListResult = {
  cards: Card[];
  totalCount: number;
  page: number;
  pageCount: number;
};

// % and _ are LIKE wildcards; escape them so searching "100%" matches the
// literal characters instead of everything containing "100".
function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export async function listCards(
  client: SupabaseClient,
  options: CardListOptions = {},
): Promise<CardListResult> {
  // The filter Tag goes through the same normalization as stored Tags, so
  // "Histoire " finds Cards tagged "histoire". A blank Tag means no filter.
  const tag = normalizeTag(options.tag ?? "");
  const search = (options.search ?? "").trim();
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const pageSize = options.pageSize ?? CARD_LIST_PAGE_SIZE;

  let query = client.from("cards").select("*", { count: "exact" });
  if (search !== "") {
    query = query.ilike("title", `%${escapeLikePattern(search)}%`);
  }
  if (options.type) {
    query = query.eq("type", options.type);
  }
  if (tag !== "") {
    query = query.contains("tags", [tag]);
  }

  const offset = (page - 1) * pageSize;
  const {
    data: rows,
    count,
    error,
  } = await query
    .order("updated_at", { ascending: false })
    .range(offset, offset + pageSize - 1);
  if (error) {
    throw new Error(`Failed to list Cards: ${error.message}`);
  }

  const totalCount = count ?? 0;
  return {
    cards: (rows as CardRow[]).map(rowToCard),
    totalCount,
    page,
    pageCount: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function getCard(
  client: SupabaseClient,
  id: string,
): Promise<Card | null> {
  const { data: row, error } = await client
    .from("cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load Card: ${error.message}`);
  }
  return row ? rowToCard(row as CardRow) : null;
}

// updated_at is bumped by the cards_set_updated_at trigger, not here.
export async function updateCard(
  client: SupabaseClient,
  id: string,
  data: CardData,
): Promise<Card> {
  const { data: row, error } = await client
    .from("cards")
    .update({
      type: data.type,
      title: data.title,
      tags: data.tags,
      payload: data.payload,
      images: data.images,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to update Card: ${error.message}`);
  }
  return rowToCard(row as CardRow);
}

// Sets one Posted mark to an explicit state (idempotent, so a repeated click
// can't flip it back). The write touches only posted_on, which the
// set_updated_at trigger ignores — marking never reorders the list.
export async function setCardPostedOn(
  client: SupabaseClient,
  id: string,
  social: Social,
  posted: boolean,
): Promise<Card> {
  const card = await getCard(client, id);
  if (!card) {
    throw new Error("Failed to update Posted marks: Card not found");
  }

  const postedOn = posted
    ? [...new Set([...card.postedOn, social])]
    : card.postedOn.filter((existing) => existing !== social);
  const { data: row, error } = await client
    .from("cards")
    .update({ posted_on: postedOn })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to update Posted marks: ${error.message}`);
  }
  return rowToCard(row as CardRow);
}

export async function deleteCard(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  // Delete the row and recover the Images it referenced in one round-trip, so
  // their storage objects can be dropped and the bucket keeps no orphans.
  const { data: rows, error } = await client
    .from("cards")
    .delete()
    .eq("id", id)
    .select("images");
  if (error) {
    throw new Error(`Failed to delete Card: ${error.message}`);
  }

  // The row is already gone: a cleanup failure below surfaces to the caller
  // but never resurrects the Card.
  const deleted = (rows ?? []) as { images: { path: string }[] | null }[];
  const paths = deleted.flatMap((row) =>
    (row.images ?? []).map((image) => image.path),
  );
  await removeCardImages(client, paths);
}
