import { CardLibrary } from "@/app/card-library";

export const dynamic = "force-dynamic";

export default async function CardListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  return <CardLibrary filterTag={tag} />;
}
