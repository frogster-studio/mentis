// The push side of the outbox — the thin, deliberately-untested shell around Supabase and the
// query cache (PRD: query wiring and Supabase calls are not unit-tested). `drainOutbox` pushes the
// signed-in owner's queued sessions as one idempotent upsert on the client UUID; `useOutboxSync`
// fires it on the PRD's rhythm (launch, foreground, sign-in) while the finish path fires it once
// more. All queue decisions stay in the pure `outbox` seam.

import { useEffect } from "react";
import { AppState } from "react-native";
import { type AccountWorld, accountKeys } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";
import { entriesForOwner, type OutboxEntry } from "./outbox";
import { useOutboxStore } from "./outbox-store";

// The snake_case `quiz_sessions` row (row mapping lives in the network shell, as in account/api).
function toSessionRow(entry: OutboxEntry) {
  return {
    id: entry.id,
    owner: entry.owner,
    theme_id: entry.themeId,
    theme_name: entry.themeName,
    points: entry.points,
    finished_at: entry.finishedAt,
  };
}

// Postgres foreign_key_violation: the insert names an owner no longer in auth.users — the Account
// was deleted (its rows cascaded) while this device still held queued sessions. Any other error is
// treated as transient, so those rows stay queued (retention) rather than being lost.
function isOwnerGoneError(error: { code?: string }): boolean {
  return error.code === "23503";
}

// Push the owner's queued sessions, idempotently. A success drains the batch and hands the
// just-synced rows straight to the cached Account world, so the shelf stays continuous: the row
// leaves the pending overlay and joins the synced set in the same tick — never flickering, never
// counted twice. A generic failure keeps the rows for the next trigger; an owner-gone rejection
// discards that Account's rows silently.
export async function drainOutbox(owner: string): Promise<void> {
  const batch = entriesForOwner(useOutboxStore.getState().entries, owner);
  if (batch.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("quiz_sessions")
    .upsert(batch.map(toSessionRow), { onConflict: "id" });

  if (error) {
    if (isOwnerGoneError(error)) {
      useOutboxStore.getState().discardOwner(owner);
    }
    return;
  }

  // ack returns only the rows it actually removed, so a concurrent double-drain seeds them at most
  // once — the upsert already collapsed the duplicate server-side.
  const removed = useOutboxStore.getState().ack(batch.map((entry) => entry.id));
  if (removed.length === 0) {
    return;
  }
  queryClient.setQueryData<AccountWorld>(accountKeys.world(owner), (previous) => {
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
// signs in (the effect re-runs when `owner` becomes defined). The finish path drains once more,
// straight after enqueue. Signed out there is nothing to push. Mounted once, at the app root.
export function useOutboxSync(): void {
  const owner = useAuthStore((state) => state.session?.user.id);
  useEffect(() => {
    if (owner === undefined) {
      return;
    }
    void drainOutbox(owner);
    // The outbox hydrates from AsyncStorage asynchronously; if the owner resolves first, the launch
    // drain above reads an empty queue. Drain once more when hydration lands, so a backlog left by
    // a previous run still pushes at launch — not only at the next foreground or finish.
    const stopHydrationWatch = useOutboxStore.persist.hasHydrated()
      ? undefined
      : useOutboxStore.persist.onFinishHydration(() => void drainOutbox(owner));
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        void drainOutbox(owner);
      }
    });
    return () => {
      stopHydrationWatch?.();
      subscription.remove();
    };
  }, [owner]);
}
