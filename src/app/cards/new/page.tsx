import type { Metadata } from "next";

import { CardLibrary } from "@/app/card-library";

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
  // Only Anecdote is creatable in this slice; anything else falls back to
  // the type picker.
  const selectedType = type === "anecdote" ? type : undefined;

  return (
    <>
      <CardLibrary />
      <CreateCardSheet selectedType={selectedType} />
    </>
  );
}
