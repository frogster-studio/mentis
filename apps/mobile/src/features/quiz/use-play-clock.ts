import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { COUNTDOWN_TICK_MS } from "./constants";
import { isExpired } from "./countdown";

// The wall clock the Countdown reads, resynced on foreground so a Question that died away resolves.
export function usePlayClock(
  endsAt: number,
  active: boolean,
  onExpire: (now: number) => void,
): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return;
    }
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), COUNTDOWN_TICK_MS);
    return () => clearInterval(tick);
  }, [active]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        setNow(Date.now());
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (active && isExpired(endsAt, now)) {
      onExpire(now);
    }
  }, [active, endsAt, now, onExpire]);

  return now;
}
