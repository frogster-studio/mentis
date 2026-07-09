import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type Card,
  type CardData,
  cardSchema,
  normalizeTag,
} from "@/lib/cards/schema";

type CardRow = {
  id: string;
  type: string;
  title: string;
  tags: string[];
  status: string;
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
    status: row.status,
    payload: row.payload,
    images: row.images,
  });
  return {
    ...data,
    id: row.id,
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
      status: data.status,
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

export async function listCards(
  client: SupabaseClient,
  options: { tag?: string } = {},
): Promise<Card[]> {
  // The filter Tag goes through the same normalization as stored Tags, so
  // "Histoire " finds Cards tagged "histoire". A blank Tag means no filter.
  const tag = normalizeTag(options.tag ?? "");
  const base = client.from("cards").select("*");
  const filtered = tag === "" ? base : base.contains("tags", [tag]);
  const { data: rows, error } = await filtered.order("updated_at", {
    ascending: false,
  });
  if (error) {
    throw new Error(`Failed to list Cards: ${error.message}`);
  }
  return (rows as CardRow[]).map(rowToCard);
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
      status: data.status,
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

export async function deleteCard(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from("cards").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete Card: ${error.message}`);
  }
}
