import type {
  AdminCardListQuery,
  AdminCardListResponse,
  AdminCardResponse,
  AdminCardWriteInput,
  Social,
} from "@mentis/contracts/admin";
import { adminCardListResponseSchema, adminCardResponseSchema } from "@mentis/contracts/admin";

import { isApiError, requestJson, requestNoContent } from "@/lib/api/client";

const CARDS_PATH = "/admin/cards";

const cardPath = (id: string): string => `${CARDS_PATH}/${encodeURIComponent(id)}`;

export async function listCards(query: AdminCardListQuery): Promise<AdminCardListResponse> {
  return requestJson(
    {
      method: "GET",
      path: CARDS_PATH,
      query: { search: query.search, type: query.type, tag: query.tag, page: query.page },
    },
    adminCardListResponseSchema,
  );
}

export async function getCard(id: string): Promise<AdminCardResponse | null> {
  try {
    return await requestJson({ method: "GET", path: cardPath(id) }, adminCardResponseSchema);
  } catch (error) {
    if (isApiError(error, "NOT_FOUND")) {
      return null;
    }
    throw error;
  }
}

export async function createCard(input: AdminCardWriteInput): Promise<AdminCardResponse> {
  return requestJson({ method: "POST", path: CARDS_PATH, body: input }, adminCardResponseSchema);
}

export async function replaceCard(
  id: string,
  input: AdminCardWriteInput,
): Promise<AdminCardResponse> {
  return requestJson({ method: "PUT", path: cardPath(id), body: input }, adminCardResponseSchema);
}

// The whole set is replaced, so the caller sends the Posted marks it wants to stand.
export async function setCardPostedOn(id: string, postedOn: Social[]): Promise<AdminCardResponse> {
  return requestJson(
    { method: "PATCH", path: `${cardPath(id)}/posted`, body: { postedOn } },
    adminCardResponseSchema,
  );
}

export async function deleteCard(id: string): Promise<void> {
  return requestNoContent({ method: "DELETE", path: cardPath(id) });
}
