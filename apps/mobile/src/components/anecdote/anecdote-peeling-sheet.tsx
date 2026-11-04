import type { PropsWithChildren } from "react";
import Animated, { css } from "react-native-reanimated";
import { AnecdoteSheet } from "@/components/anecdote/anecdote-sheet";
import { ANECDOTE_EXIT_MS } from "@/features/anecdote/constants";
import { COLORS } from "@/theme/tokens";

const PEEL_TILT = "-6deg";

const PEEL_OFF_LEFT = css.keyframes({
  from: { opacity: 1, transform: [{ translateX: 0 }, { rotate: "0deg" }] },
  to: { opacity: 0, transform: [{ translateX: "-100%" }, { rotate: PEEL_TILT }] },
});

export interface AnecdotePeelingSheetProps {
  coversNextSheet: boolean;
}

export const AnecdotePeelingSheet = ({
  children,
  coversNextSheet,
}: PropsWithChildren<AnecdotePeelingSheetProps>) => {
  return (
    <Animated.View style={[styles.peeling, coversNextSheet && styles.overNextSheet]}>
      <AnecdoteSheet color={COLORS.face}>{children}</AnecdoteSheet>
    </Animated.View>
  );
};

const styles = css.create({
  peeling: {
    animationName: PEEL_OFF_LEFT,
    animationDuration: ANECDOTE_EXIT_MS,
    animationTimingFunction: "ease-in",
    animationFillMode: "forwards",
  },
  overNextSheet: { position: "absolute", top: 0, left: 0, right: 0 },
});
