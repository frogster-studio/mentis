import { useRef } from "react";
import { Animated, Easing, Platform } from "react-native";

export const PRESS_DEPTH = 5;

const PUSH_MS = 70;
const RELEASE_MS = 180;
// Under this, a quick tap releases before the eye ever registers the face going down.
const MIN_HOLD_MS = 90;
const PUSH_EASING = Easing.bezier(0.4, 0, 1, 1);
const RELEASE_EASING = Easing.bezier(0.16, 1, 0.3, 1);
// Web has no native animated module and warns on every press; it falls back to JS anyway.
const NATIVE_DRIVER = Platform.OS !== "web";

export function usePressSink() {
  const travel = useRef(new Animated.Value(0)).current;
  const pressedAt = useRef(0);

  const pressIn = () => {
    pressedAt.current = Date.now();
    Animated.timing(travel, {
      toValue: PRESS_DEPTH,
      duration: PUSH_MS,
      easing: PUSH_EASING,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  const pressOut = () => {
    Animated.timing(travel, {
      toValue: 0,
      duration: RELEASE_MS,
      delay: Math.max(0, MIN_HOLD_MS - (Date.now() - pressedAt.current)),
      easing: RELEASE_EASING,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  return { travel, pressIn, pressOut };
}
