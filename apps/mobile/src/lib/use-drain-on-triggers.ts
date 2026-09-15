import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState } from "react-native";

interface HydratedOutboxStore {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
}

// Drains at launch, foreground and sign-in, and again once the persisted outbox hydrates.
export function useDrainOnTriggers(
  playerId: string | undefined,
  drainOutbox: (playerId: string) => Promise<void>,
  outboxStore: HydratedOutboxStore,
): void {
  // No UI reads this mutation — it exists so every write in the app goes through one.
  const { mutate: drain } = useMutation({ mutationFn: drainOutbox });

  useEffect(() => {
    if (playerId === undefined) {
      return;
    }
    drain(playerId);
    const stopHydrationWatch = outboxStore.persist.hasHydrated()
      ? undefined
      : outboxStore.persist.onFinishHydration(() => drain(playerId));
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        drain(playerId);
      }
    });
    return () => {
      stopHydrationWatch?.();
      subscription.remove();
    };
  }, [playerId, drain, outboxStore]);
}
