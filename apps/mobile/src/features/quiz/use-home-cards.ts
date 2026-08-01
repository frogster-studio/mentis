import { useMemo } from "react";
import { useAccountWorld } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { foldAccountStats } from "./account-stats";
import { overlaySessions } from "./outbox";
import { useOutboxStore } from "./outbox-store";
import { type HomeCard, homeCards } from "./stats";
import { useStatsStore } from "./stats-store";

// The world selector behind the home shelf: signed in → Account Stats (the fold of baselines +
// synced sessions + still-pending local sessions); signed out → Device Stats, exactly as before.
// The world is chosen by auth state and the two never mix. The Device store, the Account query and
// the outbox are all read unconditionally (the hooks rule); the branch decides which one renders.
export function useHomeCards(): HomeCard[] {
  const owner = useAuthStore((state) => state.session?.user.id);
  const deviceStats = useStatsStore((state) => state.stats);
  const accountWorld = useAccountWorld(owner).data;
  const outbox = useOutboxStore((state) => state.entries);

  return useMemo(() => {
    if (owner === undefined) {
      return homeCards(deviceStats);
    }
    // Empty until the pull lands (or the cache restores on an offline launch). The optimistic
    // overlay — this Account's still-pending sessions, reconciled by id against the synced pull —
    // puts a just-finished session on the shelf instantly, offline included; a push moves each row
    // from this overlay to the synced set without ever double-counting a session in flight.
    const world = accountWorld ?? { baselines: [], sessions: [] };
    const syncedIds = new Set(world.sessions.map((session) => session.id));
    const pending = overlaySessions(outbox, owner, syncedIds);
    return homeCards(foldAccountStats(world.baselines, world.sessions, pending));
  }, [owner, deviceStats, accountWorld, outbox]);
}
