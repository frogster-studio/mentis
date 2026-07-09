import { CardLibrary } from "@/app/card-library";
import {
  parseListParams,
  type RawListSearchParams,
} from "@/lib/cards/list-params";

export const dynamic = "force-dynamic";

export default async function CardListPage({
  searchParams,
}: {
  searchParams: Promise<RawListSearchParams>;
}) {
  const listParams = parseListParams(await searchParams);
  return <CardLibrary listParams={listParams} />;
}
