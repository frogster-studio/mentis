import { type AppProfileResponse, appProfileResponseSchema } from "@mentis/contracts/app";
import type { ApiClient, ApiRequest } from "@/lib/api/client";

const PROFILE_PATH = "/app/me/profile";
const PSEUDO_PATH = "/app/me/pseudo";

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
