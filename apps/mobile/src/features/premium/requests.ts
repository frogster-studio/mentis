import { type AppPremiumResponse, appPremiumResponseSchema } from "@mentis/contracts/app";
import type { ApiClient, ApiRequest } from "@/lib/api/client";

export const premiumRequest: ApiRequest = { method: "GET", path: "/app/me/premium" };

// The activation moment polls this after a purchase until active flips true.
export function fetchPremium(api: ApiClient): Promise<AppPremiumResponse> {
  return api.requestJson(premiumRequest, appPremiumResponseSchema);
}
