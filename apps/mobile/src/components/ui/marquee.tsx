import type { PropsWithChildren } from "react";
import { View } from "react-native";
import Animated, { css } from "react-native-reanimated";

const LOOP_DURATION = "60s";

// Two identical runs: sliding by half the track lands the second exactly where the first began.
const SCROLL = css.keyframes({
  from: { transform: [{ translateX: 0 }] },
  to: { transform: [{ translateX: "-50%" }] },
});

export interface MarqueeProps {
  gap: number;
}

export const Marquee = ({ children, gap }: PropsWithChildren<MarqueeProps>) => {
  const run = <View style={[styles.row, { gap, paddingRight: gap }]}>{children}</View>;

  return (
    <View style={styles.viewport}>
      <Animated.View style={[styles.row, styles.track]}>
        {run}
        {run}
      </Animated.View>
    </View>
  );
};

const styles = css.create({
  viewport: { overflow: "hidden", pointerEvents: "none" },
  row: { flexDirection: "row", alignItems: "center" },
  track: {
    alignSelf: "flex-start",
    animationName: SCROLL,
    animationDuration: LOOP_DURATION,
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",
  },
});
