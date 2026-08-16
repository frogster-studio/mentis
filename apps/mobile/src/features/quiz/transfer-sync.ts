import { accountKeys } from "@/features/account/api";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { pushInBatches } from "./batch-push";
import { useStatsStore } from "./stats-store";
import { buildTransferBaselines } from "./stats-transfer";
import { useTransferStore } from "./transfer-store";

// The device world empties only after every batch lands — a part-way failure leaves it untouched.
export async function transferDeviceStats(playerId: string): Promise<void> {
  const device = useTransferStore.getState().ensureDevice();
  const baselines = buildTransferBaselines(useStatsStore.getState().stats, device);
  if (baselines.length === 0) {
    return;
  }

  await pushInBatches(baselines, (batch) =>
    api.requestNoContent({ method: "POST", path: "/app/me/stat-baselines", body: batch }),
  );

  useStatsStore.getState().reset();
  useTransferStore.getState().markTransferred();
  await queryClient.invalidateQueries({ queryKey: accountKeys.stats(playerId) });
}
