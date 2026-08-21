// Every competition path and payload in one pure place, so the wire shape is testable alone.

import type { ApiRequest } from "@/lib/api/client";
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
