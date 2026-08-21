import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@/features/account/auth-store";
import { queryClient } from "@/lib/query-client";
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
      }
      // Anything else is transient: the batch waits for the next trigger.
    }
  }
}

// Drains at launch, foreground and sign-in; mounted once, at the app root.
export function useCompetitionSync(): void {
  const playerId = useAuthStore((state) => state.session?.user.id);
  // No UI reads this mutation — it exists so every write in the app goes through one.
  const { mutate: drain } = useMutation({ mutationFn: drainFinalizeOutbox });

  useEffect(() => {
    if (playerId === undefined) {
      return;
    }
    drain(playerId);
    // The outbox hydrates asynchronously: drain again once hydration lands to push a backlog.
    const stopHydrationWatch = useFinalizeOutboxStore.persist.hasHydrated()
      ? undefined
      : useFinalizeOutboxStore.persist.onFinishHydration(() => drain(playerId));
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        drain(playerId);
      }
    });
    return () => {
      stopHydrationWatch?.();
      subscription.remove();
    };
  }, [playerId, drain]);
}
