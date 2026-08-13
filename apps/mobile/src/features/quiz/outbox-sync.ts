// The push side of the outbox — the thin shell around the API seam and the query cache.
// `drainOutbox` pushes the signed-in Player's queued sessions in capped batches, each one idempotent
// on the client UUID; `useOutboxSync` fires it on the PRD's rhythm (launch, foreground, sign-in)
// while the finish path fires it once more. All queue decisions stay in the pure `outbox` seam.

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

// The push body: exactly the contract's session rows. The owner never goes on the wire — the API
// derives it from the verified token.
function toPushRow(entry: OutboxEntry) {
  return {
    id: entry.id,
    themeId: entry.themeId,
    themeName: entry.themeName,
    points: entry.points,
    finishedAt: entry.finishedAt,
  };
}

// Push the Player's queued sessions, idempotently and in capped batches. Each landed batch is acked
// on its own, so a long backlog that fails halfway keeps the progress it made: the rows that landed
// leave the queue, the rest wait for the next trigger. A success hands the just-synced rows straight
// to the cached Account Stats, so the shelf stays continuous — the row leaves the pending overlay
// and joins the synced set in the same tick, never flickering, never counted twice. An owner-gone
// rejection discards that Account's rows silently.
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

// ack returns only the rows it actually removed, so a concurrent double-drain seeds them at most
// once — the server-side insert-if-absent already collapsed the duplicate.
function seedAckedSessions(playerId: string, batch: OutboxEntry[]): void {
  const removed = useOutboxStore.getState().ack(batch.map((entry) => entry.id));
  if (removed.length === 0) {
    return;
  }
  queryClient.setQueryData<AppAccountStatsResponse>(accountKeys.stats(playerId), (previous) => {
    // Seed only rows the cache does not already hold. A concurrent foreground pull may have landed
    // the same row first; because it carries the client UUID, reconciling by id keeps the shelf
    // continuous (the row never flickers) without ever counting the session twice.
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

// Drives the push rhythm (PRD): drain at launch and on every foreground, and whenever an Account
// signs in (the effect re-runs when `playerId` becomes defined). The finish path drains once more,
// straight after enqueue. Signed out there is nothing to push. Mounted once, at the app root.
export function useOutboxSync(): void {
  const playerId = useAuthStore((state) => state.session?.user.id);
  // A background push with no UI state of its own, so the mutation earns its place by shape rather
  // than by state: every write in the app goes through one, and this one gives the three triggers
  // below a single call site. `drainOutbox` absorbs its own failures (retention), so nothing here
  // ever sees an error.
  const { mutate: drain } = useMutation({ mutationFn: drainOutbox });

  useEffect(() => {
    if (playerId === undefined) {
      return;
    }
    drain(playerId);
    // The outbox hydrates from AsyncStorage asynchronously; if the id resolves first, the launch
    // drain above reads an empty queue. Drain once more when hydration lands, so a backlog left by
    // a previous run still pushes at launch — not only at the next foreground or finish.
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
