import { CARD_TYPES, type CardType, normalizeTag } from "@/lib/cards/schema";

// Query params as Next.js delivers them; a repeated key arrives as an array.
export type RawListSearchParams = {
  [key: string]: string | string[] | undefined;
};

// The list's full URL state: search, filters, and page. Everything the list
// renders derives from this, so any view is shareable and refresh-safe.
export type CardListParams = {
  search: string;
  type?: CardType;
  tag: string;
  page: number;
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

// Unknown types and page numbers degrade to "no filter" / page 1 instead of
// erroring — a hand-edited URL still renders a valid list.
export function parseListParams(params: RawListSearchParams): CardListParams {
  const page = Number.parseInt(first(params.page), 10);
  return {
    search: first(params.q).trim(),
    type: CARD_TYPES.find((type) => type === first(params.type)),
    tag: normalizeTag(first(params.tag)),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

// Serializes list state back into a URL, with overrides for the link being
// built (a page control, a Tag chip). Defaults are omitted to keep URLs clean.
export function buildListHref(
  basePath: string,
  params: CardListParams,
  overrides: Partial<CardListParams> = {},
): string {
  const { search, type, tag, page } = { ...params, ...overrides };
  const query = new URLSearchParams();
  if (search !== "") query.set("q", search);
  if (type) query.set("type", type);
  if (tag !== "") query.set("tag", tag);
  if (page > 1) query.set("page", String(page));
  const queryString = query.toString();
  return queryString === "" ? basePath : `${basePath}?${queryString}`;
}
