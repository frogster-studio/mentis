import {
  type AppHistoryPageResponse,
  type AppProfileResponse,
  appHistoryPageResponseSchema,
  appProfileResponseSchema,
} from "@mentis/contracts/app";
import type { ApiClient, ApiRequest } from "@/lib/api/client";

const PROFILE_PATH = "/app/me/profile";
const PSEUDO_PATH = "/app/me/pseudo";
const HISTORY_PATH = "/app/me/history";

export const profileRequest: ApiRequest = { method: "GET", path: PROFILE_PATH };

export function setPseudoRequest(pseudo: string): ApiRequest {
  return { method: "PUT", path: PSEUDO_PATH, body: { pseudo } };
}

// The API names an Account on this read, so the answer never carries an empty pseudo.
export function fetchProfile(api: ApiClient): Promise<AppProfileResponse> {
  return api.requestJson(profileRequest, appProfileResponseSchema);
}

// The pseudo is stored as typed; a key another Account holds comes back as PSEUDO_TAKEN.
export function setPseudo(api: ApiClient, pseudo: string): Promise<AppProfileResponse> {
  return api.requestJson(setPseudoRequest(pseudo), appProfileResponseSchema);
}

export function historyPageRequest(before: string | undefined): ApiRequest {
  return { method: "GET", path: HISTORY_PATH, query: { before } };
}

// No cursor reads the newest page; each page names the cursor of the next one.
export function fetchHistoryPage(
  api: ApiClient,
  before: string | undefined,
): Promise<AppHistoryPageResponse> {
  return api.requestJson(historyPageRequest(before), appHistoryPageResponseSchema);
}
