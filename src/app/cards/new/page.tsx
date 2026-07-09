import type { Metadata } from "next";

import { CardLibrary } from "@/app/card-library";
import { CARD_TYPES } from "@/lib/cards/schema";

import { CreateCardSheet } from "./create-card-sheet";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Card — Mentis",
};

export default async function NewCardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  // Anything but a known Card Type falls back to the type picker.
  const selectedType = CARD_TYPES.find((known) => known === type);

  return (
    <>
      <CardLibrary />
      <CreateCardSheet selectedType={selectedType} />
    </>
  );
}
