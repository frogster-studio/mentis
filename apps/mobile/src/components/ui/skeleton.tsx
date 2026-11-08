import { useEffect } from "react";
import { type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  makeMutable,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Squircle } from "@/components/ui/squircle";
import { useReduceMotion } from "@/components/ui/use-reduce-motion";
import { COLORS } from "@/theme/tokens";

const PULSE_PHASE_MS = 1000;
const PULSE_DIM_OPACITY = 0.4;
const INK_ALPHA = "1A";
const FACE_ALPHA = "33";

// One clock for every skeleton on screen, so they breathe in unison; it runs only while one pulses.
const pulse = makeMutable(0);
let pulsingCount = 0;

const joinPulse = () => {
  pulsingCount += 1;
  if (pulsingCount === 1) {
    pulse.value = withRepeat(
      withTiming(1, { duration: PULSE_PHASE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }
};

const leavePulse = () => {
  pulsingCount -= 1;
  if (pulsingCount === 0) {
    cancelAnimation(pulse);
    pulse.value = 0;
  }
};

interface SkeletonProps {
  radius: number;
  isOnDark: boolean;
  isFrozen: boolean;
  style: StyleProp<ViewStyle>;
}

export const Skeleton = ({ radius, isOnDark, isFrozen, style }: SkeletonProps) => {
  const isPulsing = !useReduceMotion() && !isFrozen;

  useEffect(() => {
    if (!isPulsing) {
      return;
    }
    joinPulse();
    return leavePulse;
  }, [isPulsing]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: isPulsing ? interpolate(pulse.value, [0, 1], [1, PULSE_DIM_OPACITY]) : 1,
  }));

  return (
    <Animated.View style={[style, pulseStyle]}>
      <Squircle
        radius={radius}
        corners="all"
        color={isOnDark ? `${COLORS.face}${FACE_ALPHA}` : `${COLORS.ink}${INK_ALPHA}`}
        borderColor={null}
        borderWidth={null}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};
