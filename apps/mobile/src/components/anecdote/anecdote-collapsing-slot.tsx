import Animated, { css } from "react-native-reanimated";
import { ANECDOTE_COLLAPSE_MS } from "@/features/anecdote/constants";
import { GUTTER } from "@/theme/tokens";

export interface AnecdoteCollapsingSlotProps {
  height: number;
}

export const AnecdoteCollapsingSlot = ({ height }: AnecdoteCollapsingSlotProps) => {
  return (
    <Animated.View
      style={[
        styles.slot,
        {
          animationName: {
            from: { height, marginTop: GUTTER },
            to: { height: 0, marginTop: 0 },
          },
        },
      ]}
    />
  );
};

const styles = css.create({
  slot: {
    animationDuration: ANECDOTE_COLLAPSE_MS,
    animationTimingFunction: "ease-in-out",
    animationFillMode: "forwards",
  },
});
