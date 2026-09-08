import { type Animated, Easing } from "react-native";

// The scene slide, the header title and the tab chip are one gesture, so they share its timing.
export const TAB_TRANSITION_MS = 250;
export const TAB_TRANSITION_EASING = Easing.out(Easing.cubic);

const watched = new WeakSet<Animated.Value>();

// The native driver never reports back, so a re-render can strand the focused tab off-screen.
export function watchTabProgress(progress: Animated.Value): Animated.Value {
  if (!watched.has(progress)) {
    watched.add(progress);
    progress.addListener(() => {});
  }
  return progress;
}
