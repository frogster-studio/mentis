import type { StyleProp, ViewStyle } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import Animated, { css } from "react-native-reanimated";
import { COLORS } from "@/theme/tokens";

const AnimatedFastSquircleView = Animated.createAnimatedComponent(FastSquircleView);

const PULSE_DURATION = "800ms";

const PULSE = css.keyframes({
  from: { opacity: 1 },
  to: { opacity: 0.4 },
});

export interface SkeletonProps {
  style: StyleProp<ViewStyle>;
}

export const Skeleton = ({ style }: SkeletonProps) => {
  return <AnimatedFastSquircleView style={[styles.bone, style]} />;
};

const styles = css.create({
  bone: {
    backgroundColor: COLORS.trough,
    animationName: PULSE,
    animationDuration: PULSE_DURATION,
    animationIterationCount: "infinite",
    animationDirection: "alternate",
    animationTimingFunction: "ease-in-out",
  },
});
