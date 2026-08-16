import type { AppAccountStatsResponse } from "@mentis/contracts/app";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState } from "react-native";
import { accountKeys } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { isOwnerGoneError, pushInBatches } from "./batch-push";
import { entriesForOwner, type OutboxEntry } from "./outbox";
import { useOutboxStore } from "./outbox-store";

// The owner never goes on the wire — the API derives it from the verified token.
function toPushRow(entry: OutboxEntry) {
  return {
    id: entry.id,
    themeId: entry.themeId,
    themeName: entry.themeName,
    points: entry.points,
    finishedAt: entry.finishedAt,
  };
}

// Each landed batch is acked on its own, so a backlog that fails halfway keeps the progress made.
export async function drainOutbox(playerId: string): Promise<void> {
  const queued = entriesForOwner(useOutboxStore.getState().entries, playerId);
  try {
    await pushInBatches(
      queued,
      (batch) =>
        api.requestNoContent({
          method: "POST",
          path: "/app/me/quiz-sessions",
          body: batch.map(toPushRow),
        }),
      (batch) => seedAckedSessions(playerId, batch),
    );
  } catch (error) {
    if (isOwnerGoneError(error)) {
      useOutboxStore.getState().discardOwner(playerId);
    }
    // Anything else is transient: the batches still queued wait for the next trigger.
  }
}

// ack returns only the rows it actually removed, so a concurrent double-drain seeds at most once.
function seedAckedSessions(playerId: string, batch: OutboxEntry[]): void {
  const removed = useOutboxStore.getState().ack(batch.map((entry) => entry.id));
  if (removed.length === 0) {
    return;
  }
  queryClient.setQueryData<AppAccountStatsResponse>(accountKeys.stats(playerId), (previous) => {
    // A concurrent pull may have landed the same row first; matching by id never counts it twice.
    const known = new Set((previous?.sessions ?? []).map((session) => session.id));
    const fresh = removed.filter((entry) => !known.has(entry.id));
    if (fresh.length === 0) {
      return previous;
    }
    return {
      baselines: previous?.baselines ?? [],
      sessions: [
        ...(previous?.sessions ?? []),
        ...fresh.map((entry) => ({
          id: entry.id,
          themeId: entry.themeId,
          themeName: entry.themeName,
          points: entry.points,
        })),
      ],
    };
  });
}

// Drains at launch, foreground and sign-in; mounted once, at the app root.
export function useOutboxSync(): void {
  const playerId = useAuthStore((state) => state.session?.user.id);
  // No UI reads this mutation — it exists so every write in the app goes through one.
  const { mutate: drain } = useMutation({ mutationFn: drainOutbox });

  useEffect(() => {
    if (playerId === undefined) {
      return;
    }
    drain(playerId);
    // The outbox hydrates asynchronously: drain again once hydration lands to push a backlog.
    const stopHydrationWatch = useOutboxStore.persist.hasHydrated()
      ? undefined
      : useOutboxStore.persist.onFinishHydration(() => drain(playerId));
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
