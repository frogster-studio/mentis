import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardLibrary } from "@/app/card-library";
import { getCard } from "@/lib/api/cards";
import { parseListParams, type RawListSearchParams } from "@/lib/cards/list-params";
import { cardImagePublicUrl } from "@/lib/images/public-url";

import { EditCardSheet } from "./edit-card-sheet";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Card — Mentis",
};

export default async function CardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawListSearchParams>;
}) {
  const { id } = await params;
  // The row link carries the query params along, so the list behind the sheet keeps its view.
  const listParams = parseListParams(await searchParams);

  const card = await getCard(id);
  if (!card) {
    notFound();
  }

  // The public URLs are built here because SUPABASE_URL is server-only.
  const storedImages = card.images.map((image) => ({
    path: image.path,
    caption: image.caption ?? "",
    url: cardImagePublicUrl(image.path),
  }));

  return (
    <>
      <CardLibrary activeCardId={card.id} listParams={listParams} />
      <EditCardSheet card={card} storedImages={storedImages} />
    </>
  );
}
