import type { AppAccountStatsResponse } from "@mentis/contracts/app";
import { accountKeys } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { useDrainOnTriggers } from "@/lib/use-drain-on-triggers";
import { isOwnerGoneError, pushInBatches } from "./batch-push";
import { entriesForOwner, type OutboxEntry, withAckedSessions } from "./outbox";
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
  queryClient.setQueryData<AppAccountStatsResponse>(accountKeys.stats(playerId), (previous) =>
    // Never loaded: the next pull brings the acked rows, so nothing is invented in the meantime.
    previous === undefined ? previous : withAckedSessions(previous, removed),
  );
}

// Mounted once, at the app root.
export function useOutboxSync(): void {
  const playerId = useAuthStore((state) => state.session?.user.id);
  useDrainOnTriggers(playerId, drainOutbox, useOutboxStore);
}
