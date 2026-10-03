import * as Haptics from "expo-haptics";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { THEME_REVEAL_DURATION_MS, THEME_REVEAL_TICK_MS } from "./constants";

const REVEAL_SECONDS = THEME_REVEAL_DURATION_MS / THEME_REVEAL_TICK_MS;

// The Reveal is a fixed moment: nothing skips it and nothing — a slow image included — extends it.
export function useThemeReveal(isRevealable: boolean): { isDone: boolean; secondsLeft: number } {
  const [isDone, setIsDone] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(REVEAL_SECONDS);
  const navigation = useNavigation();
  const isRevealing = isRevealable && !isDone;

  useEffect(() => {
    if (!isRevealable) {
      return;
    }
    const ticks = Array.from({ length: REVEAL_SECONDS }, (_, elapsedSeconds) =>
      setTimeout(() => {
        setSecondsLeft(REVEAL_SECONDS - elapsedSeconds);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, elapsedSeconds * THEME_REVEAL_TICK_MS),
    );
    // The duration hangs off its own timer, so a drifting tick can never stretch the Reveal.
    const ending = setTimeout(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsDone(true);
    }, THEME_REVEAL_DURATION_MS);
    return () => {
      ticks.forEach(clearTimeout);
      clearTimeout(ending);
    };
  }, [isRevealable]);

  // The Reveal offers no way out, so the back gesture is barred until the first Question exists.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !isRevealing });
  }, [navigation, isRevealing]);

  return { isDone, secondsLeft };
}
