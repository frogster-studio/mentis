import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { CardLibrary } from "@/app/card-library";
import { getCard } from "@/lib/cards/data";
import {
  parseListParams,
  type RawListSearchParams,
} from "@/lib/cards/list-params";
import { createServiceClient } from "@/lib/supabase";

import { EditCardSheet } from "./edit-card-sheet";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Card — Mentis",
};

const cardIdSchema = z.uuid();

export default async function CardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawListSearchParams>;
}) {
  const { id } = await params;
  // The row link carries the list's query params along, so the list behind
  // the sidebar keeps its searched, filtered, paginated view.
  const listParams = parseListParams(await searchParams);
  // Postgres rejects a malformed uuid with an error; treat it as a Card
  // that doesn't exist instead.
  if (!cardIdSchema.safeParse(id).success) {
    notFound();
  }

  const card = await getCard(createServiceClient(), id);
  if (!card) {
    notFound();
  }

  return (
    <>
      <CardLibrary activeCardId={card.id} listParams={listParams} />
      <EditCardSheet card={card} />
    </>
  );
}
