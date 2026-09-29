import { useMemo } from "react";
import { useAccountStats } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { useCachedThemes } from "./api";
import { accountTallies } from "./outbox";
import { useOutboxStore } from "./outbox-store";
import { deviceTallies } from "./stats";
import { useStatsStore } from "./stats-store";
import type { ThemeTally } from "./theme-tallies";

// All sources are read unconditionally (the hooks rule); auth state picks which world counts.
export function useThemeTallies(): ThemeTally[] {
  const owner = useAuthStore((state) => state.session?.user.id);
  const accountThemes = useAccountStats(owner).data?.themes;
  const outbox = useOutboxStore((state) => state.entries);
  const deviceStats = useStatsStore((state) => state.stats);
  const catalog = useCachedThemes().data;

  return useMemo(() => {
    if (owner === undefined) {
      return deviceTallies(deviceStats, catalog ?? []);
    }
    // The pending overlay shows a just-finished session at once, offline included.
    return accountTallies(accountThemes ?? [], outbox, owner);
  }, [owner, accountThemes, outbox, deviceStats, catalog]);
}
