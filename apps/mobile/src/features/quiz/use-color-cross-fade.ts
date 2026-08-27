import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

const FADE_MS = 250;

export type ColorCrossFade = {
  base: string | null;
  top: string | null;
  baseOpacity: Animated.Value;
  topOpacity: Animated.Value;
};

// Fades the new colour in over the old, so a Category switch never flashes through blank.
export function useColorCrossFade(color: string | null): ColorCrossFade {
  const [pair, setPair] = useState<{ base: string | null; top: string | null }>({
    base: null,
    top: null,
  });
  const baseOpacity = useRef(new Animated.Value(0)).current;
  const topOpacity = useRef(new Animated.Value(0)).current;
  const fadedTo = useRef<string | null>(null);

  useEffect(() => {
    setPair((current) => (current.top === color ? current : { base: current.top, top: color }));
  }, [color]);

  useEffect(() => {
    // Dropping the spent base layer re-runs this pass; the settled fade must not restart.
    if (fadedTo.current === pair.top) {
      return;
    }
    fadedTo.current = pair.top;
    baseOpacity.setValue(pair.base ? 1 : 0);
    topOpacity.setValue(0);
    const fade = Animated.parallel([
      Animated.timing(topOpacity, {
        toValue: pair.top ? 1 : 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }),
      Animated.timing(baseOpacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }),
    ]);
    fade.start(({ finished }) => {
      if (finished) {
        setPair((current) => (current.base ? { ...current, base: null } : current));
      }
    });
    return () => fade.stop();
  }, [pair, baseOpacity, topOpacity]);

  return { base: pair.base, top: pair.top, baseOpacity, topOpacity };
}
