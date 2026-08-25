import { useMemo } from "react";
import { useAccountStats } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { foldAccountStats } from "./account-stats";
import { useThemes } from "./api";
import { overlaySessions } from "./outbox";
import { useOutboxStore } from "./outbox-store";
import { attachCategories, type HomeCard, homeCards } from "./stats";
import { useStatsStore } from "./stats-store";

// All sources are read unconditionally (the hooks rule); auth state picks which world renders.
export function useHomeCards(): HomeCard[] {
  const owner = useAuthStore((state) => state.session?.user.id);
  const deviceStats = useStatsStore((state) => state.stats);
  const accountStats = useAccountStats(owner).data;
  const outbox = useOutboxStore((state) => state.entries);
  const themes = useThemes().data;

  return useMemo(() => {
    const withCategories = (cards: HomeCard[]) =>
      themes ? attachCategories(cards, themes) : cards;
    if (owner === undefined) {
      return withCategories(homeCards(deviceStats));
    }
    // The pending overlay puts a just-finished session on the shelf instantly, offline included.
    const stats = accountStats ?? { baselines: [], sessions: [] };
    const syncedIds = new Set(stats.sessions.map((session) => session.id));
    const pending = overlaySessions(outbox, owner, syncedIds);
    return withCategories(homeCards(foldAccountStats(stats.baselines, stats.sessions, pending)));
  }, [owner, deviceStats, accountStats, outbox, themes]);
}
