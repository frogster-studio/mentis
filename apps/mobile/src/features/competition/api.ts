import {
  type AppCompetitionAttemptKind,
  type AppCompetitionAttemptResponse,
  type AppCompetitionTranscriptResponse,
  appCompetitionTranscriptResponseSchema,
} from "@mentis/contracts/app";
import { useQuery } from "@tanstack/react-query";
import { prefetchThemeImages } from "@/features/quiz/theme-image-cache";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { isPermanentRefusal, queuedFinalize } from "./finalize-outbox";
import { useFinalizeOutboxStore } from "./finalize-outbox-store";
import { fetchCompetitionDay, finalizeAttemptRequest, resumeOrIssueAttempt } from "./requests";

export const competitionKeys = {
  attempts: (playerId: string) => ["competition", "attempt", playerId] as const,
  attempt: (playerId: string, kind: AppCompetitionAttemptKind) =>
    [...competitionKeys.attempts(playerId), kind] as const,
  day: (playerId: string) => ["competition", "day", playerId] as const,
  transcript: (attemptId: string) => ["competition", "transcript", attemptId] as const,
};

export function useAttempt(playerId: string | undefined, kind: AppCompetitionAttemptKind) {
  return useQuery({
    queryKey: competitionKeys.attempt(playerId ?? "", kind),
    queryFn: async () => {
      const attempt = await resumeOrIssueAttempt(api, kind);
      // The drawn Theme may be newer than any cached list, so issuance itself warms its image.
      prefetchThemeImages([attempt.imageUrl]);
      return attempt;
    },
    enabled: playerId !== undefined,
    // The Attempt is fixed at issuance, so re-serving it mid-play would restart the Countdown.
    staleTime: Number.POSITIVE_INFINITY,
    // A refusal is the day's answer, not a blip: only a transient failure earns another ask.
    retry: (_failureCount, error) => !isPermanentRefusal(error),
  });
}

// Re-read on every mount: the Paris midnight and every finalize move what the day still allows.
export function useCompetitionDay(playerId: string | undefined) {
  return useQuery({
    queryKey: competitionKeys.day(playerId ?? ""),
    queryFn: () => fetchCompetitionDay(api),
    enabled: playerId !== undefined,
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
  // A judged Attempt is what unlocks a Replay or fills a Catch-up, so the day is read again.
  void queryClient.invalidateQueries({ queryKey: competitionKeys.day(owner) });
  return transcript;
}

// A judged Attempt is spent: without this the cached issuance would send the Player back into play.
function consumeAttempt(owner: string, attemptId: string): void {
  queryClient.setQueriesData<AppCompetitionAttemptResponse>(
    { queryKey: competitionKeys.attempts(owner) },
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
