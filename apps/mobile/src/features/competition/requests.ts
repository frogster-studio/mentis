// Every competition call in one place, its client injected, so the wire sequence is testable alone.

import {
  type AppCompetitionAttemptResponse,
  appCompetitionActiveAttemptResponseSchema,
  appCompetitionAttemptResponseSchema,
} from "@mentis/contracts/app";
import type { ApiClient, ApiRequest } from "@/lib/api/client";
import type { PlayedAnswer } from "./attempt-reducer";

const ATTEMPTS_PATH = "/app/me/competition/attempts";

export const activeAttemptRequest: ApiRequest = {
  method: "GET",
  path: `${ATTEMPTS_PATH}/active`,
};

export const issueAttemptRequest: ApiRequest = { method: "POST", path: ATTEMPTS_PATH };

// The served prefix and nothing else: raw input, self-reported mode, elapsed — no verdict.
export function finalizeAttemptRequest(attemptId: string, answers: PlayedAnswer[]): ApiRequest {
  return {
    method: "POST",
    path: `${ATTEMPTS_PATH}/${attemptId}/finalize`,
    body: { answers },
  };
}

// A crashed session resumes on its own Questions; only a Player holding none is issued a draw.
export async function resumeOrIssueAttempt(api: ApiClient): Promise<AppCompetitionAttemptResponse> {
  const { attempt } = await api.requestJson(
    activeAttemptRequest,
    appCompetitionActiveAttemptResponseSchema,
  );
  return attempt ?? api.requestJson(issueAttemptRequest, appCompetitionAttemptResponseSchema);
}
