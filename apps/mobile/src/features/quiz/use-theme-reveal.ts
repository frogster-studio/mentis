import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { THEME_REVEAL_DURATION_MS } from "./constants";

// The Reveal is a fixed moment: nothing skips it and nothing — a slow image included — extends it.
export function useThemeReveal(): boolean {
  const [isDone, setIsDone] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => setIsDone(true), THEME_REVEAL_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // The Reveal offers no way out, so the back gesture is barred until the first Question exists.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: isDone });
  }, [navigation, isDone]);

  return isDone;
}
