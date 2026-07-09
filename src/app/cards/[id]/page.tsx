import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { CardLibrary } from "@/app/card-library";
import { getCard } from "@/lib/cards/data";
import { createServiceClient } from "@/lib/supabase";

import { EditCardSheet } from "./edit-card-sheet";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Card — Mentis",
};

const cardIdSchema = z.uuid();

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      <CardLibrary activeCardId={card.id} />
      <EditCardSheet card={card} />
    </>
  );
}
