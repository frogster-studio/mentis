import {
  type AppCompetitionAttemptResponse,
  type AppCompetitionTranscriptResponse,
  appCompetitionActiveAttemptResponseSchema,
  appCompetitionAttemptResponseSchema,
  appCompetitionTranscriptResponseSchema,
} from "@mentis/contracts/app";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { queuedFinalize } from "./finalize-outbox";
import { useFinalizeOutboxStore } from "./finalize-outbox-store";
import { activeAttemptRequest, finalizeAttemptRequest, issueAttemptRequest } from "./requests";

export const competitionKeys = {
  attempt: (playerId: string) => ["competition", "attempt", playerId] as const,
  transcript: (attemptId: string) => ["competition", "transcript", attemptId] as const,
};

// A crashed session resumes on its own Questions; only a Player holding none is issued a draw.
async function todayAttempt(): Promise<AppCompetitionAttemptResponse> {
  const { attempt } = await api.requestJson(
    activeAttemptRequest,
    appCompetitionActiveAttemptResponseSchema,
  );
  return attempt ?? api.requestJson(issueAttemptRequest, appCompetitionAttemptResponseSchema);
}

export function useTodayAttempt(playerId: string | undefined) {
  return useQuery({
    queryKey: competitionKeys.attempt(playerId ?? ""),
    queryFn: todayAttempt,
    enabled: playerId !== undefined,
    // The Attempt is fixed at issuance, so re-serving it mid-play would restart the Countdown.
    staleTime: Number.POSITIVE_INFINITY,
  });
}

// Idempotent by design: an Attempt whose batch already landed hands back its stored transcript.
export async function pushFinalize(
  owner: string,
  attemptId: string,
): Promise<AppCompetitionTranscriptResponse> {
  const queued = queuedFinalize(useFinalizeOutboxStore.getState().entries, attemptId);
  const transcript = await api.requestJson(
    finalizeAttemptRequest(attemptId, queued?.answers ?? []),
    appCompetitionTranscriptResponseSchema,
  );
  useFinalizeOutboxStore.getState().ack(attemptId);
  consumeAttempt(owner, attemptId);
  return transcript;
}

// A judged Attempt is spent: without this the cached issuance would send the Player back into play.
function consumeAttempt(owner: string, attemptId: string): void {
  queryClient.setQueryData<AppCompetitionAttemptResponse>(
    competitionKeys.attempt(owner),
    (previous) => (previous?.id === attemptId ? { ...previous, status: "finalized" } : previous),
  );
}

export function useTranscript(
  owner: string | undefined,
  attemptId: string | undefined,
  judgeable: boolean,
) {
  return useQuery({
    // Keyed on the Attempt alone: the queue is acked mid-push, and the transcript must survive it.
    queryKey: competitionKeys.transcript(attemptId ?? ""),
    queryFn: () => pushFinalize(owner ?? "", attemptId ?? ""),
    enabled: judgeable && owner !== undefined && attemptId !== undefined,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
