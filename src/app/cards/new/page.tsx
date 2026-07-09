import type { Metadata } from "next";

import { CardLibrary } from "@/app/card-library";
import { ENABLED_CARD_TYPES } from "@/lib/cards/schema";

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
  // Anything but an enabled Card Type falls back to the type picker.
  const selectedType = ENABLED_CARD_TYPES.find((enabled) => enabled === type);

  return (
    <>
      <CardLibrary />
      <CreateCardSheet selectedType={selectedType} />
    </>
  );
}
