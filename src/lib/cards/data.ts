import type { SupabaseClient } from "@supabase/supabase-js";

import { type Card, type CardData, cardSchema } from "@/lib/cards/schema";

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

export async function listCards(client: SupabaseClient): Promise<Card[]> {
  const { data: rows, error } = await client
    .from("cards")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to list Cards: ${error.message}`);
  }
  return (rows as CardRow[]).map(rowToCard);
}
