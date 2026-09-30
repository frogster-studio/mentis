import { accountKeys } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { queryClient } from "@/lib/query-client";
import { useDrainOnTriggers } from "@/lib/use-drain-on-triggers";
import { competitionKeys, pushFinalize } from "./api";
import { finalizesForOwner, isPermanentRefusal } from "./finalize-outbox";
import { useFinalizeOutboxStore } from "./finalize-outbox-store";

// Each batch is pushed on its own, so one dead Attempt never blocks the next one's judgement.
export async function drainFinalizeOutbox(playerId: string): Promise<void> {
  const queued = finalizesForOwner(useFinalizeOutboxStore.getState().entries, playerId);
  for (const batch of queued) {
    try {
      const transcript = await pushFinalize(playerId, batch.attemptId);
      queryClient.setQueryData(competitionKeys.transcript(batch.attemptId), transcript);
    } catch (error) {
      if (isPermanentRefusal(error)) {
        useFinalizeOutboxStore.getState().ack(batch.attemptId);
        // An ATTEMPT_EXPIRED refusal means the API already buried it as a zero History line.
        void queryClient.invalidateQueries({ queryKey: accountKeys.history(playerId) });
      }
      // Anything else is transient: the batch waits for the next trigger.
    }
  }
}

// Mounted once, at the app root.
export function useCompetitionSync(): void {
  const playerId = useAuthStore((state) => state.session?.user.id);
  useDrainOnTriggers(playerId, drainFinalizeOutbox, useFinalizeOutboxStore);
}
