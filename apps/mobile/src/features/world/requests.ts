import {
  type AppCompetitionLeaderboardPageResponse,
  appCompetitionLeaderboardPageResponseSchema,
} from "@mentis/contracts/app";
import type { ApiClient, ApiRequest } from "@/lib/api/client";

const LEADERBOARD_PATH = "/app/competition/leaderboard";

// Outside the /app/me prefix on purpose: a signed-out Player reads the Leaderboard, token or not.
export function leaderboardPageRequest(page: number): ApiRequest {
  return { method: "GET", path: LEADERBOARD_PATH, query: { page: String(page) } };
}

export function fetchLeaderboardPage(
  api: ApiClient,
  page: number,
): Promise<AppCompetitionLeaderboardPageResponse> {
  return api.requestJson(leaderboardPageRequest(page), appCompetitionLeaderboardPageResponseSchema);
}
