import { useIsFocused } from "expo-router";
import { useEffect, useRef } from "react";
import { showToast } from "@/components/ui/toast";
import { COMPETITION_LOAD_ERROR } from "@/features/competition/constants";

const LOAD_ERROR_TOAST_ID = "competition-load-error";

// A read freezing while the toast still shows updates it in place, so failures landing together raise one.
export function useLoadFailureToast(frozenReads: boolean[]) {
  const isFocused = useIsFocused();
  const previous = useRef<boolean[]>([]);

  useEffect(() => {
    const newlyFrozen = frozenReads.some((isFrozen, index) => isFrozen && !previous.current[index]);
    previous.current = frozenReads;
    if (newlyFrozen && isFocused) {
      showToast(COMPETITION_LOAD_ERROR, "cloud-off-outline", "bottom-center", LOAD_ERROR_TOAST_ID);
    }
  });
}
