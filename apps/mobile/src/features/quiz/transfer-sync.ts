import { accountKeys } from "@/features/account/api";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { pushInBatches } from "./batch-push";
import { useStatsStore } from "./stats-store";
import { buildTransferBaselines, buildTransferPracticeDays } from "./stats-transfer";
import { useTransferStore } from "./transfer-store";

// The device world empties only once both pushes land in full — a failure leaves it untouched.
export async function transferDeviceStats(playerId: string): Promise<void> {
  const device = useTransferStore.getState().ensureDevice();
  const { stats, practiceDays } = useStatsStore.getState();
  const baselines = buildTransferBaselines(stats, device);
  if (baselines.length === 0) {
    return;
  }

  await pushInBatches(baselines, (batch) =>
    api.requestNoContent({ method: "POST", path: "/app/me/stat-baselines", body: batch }),
  );
  await pushInBatches(buildTransferPracticeDays(practiceDays, device), (batch) =>
    api.requestNoContent({ method: "POST", path: "/app/me/practice-days", body: batch }),
  );

  useStatsStore.getState().reset();
  useTransferStore.getState().markTransferred();
  await queryClient.invalidateQueries({ queryKey: accountKeys.stats(playerId) });
}
