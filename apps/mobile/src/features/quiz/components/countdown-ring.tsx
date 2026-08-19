import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { COUNTDOWN_DANGER_SECONDS } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT } from "@/theme/tokens";

export type CountdownRingProps = {
  fraction: number;
  seconds: number;
};

// Twin of the quit circle it sits beside.
const SIZE = CONTROL_HEIGHT;
const STROKE_WIDTH = 6;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownRing({ fraction, seconds }: CountdownRingProps) {
  const urgent = seconds <= COUNTDOWN_DANGER_SECONDS;

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={COLORS.quiet}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={urgent ? COLORS.danger : COLORS.primary}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={styles.secondsOverlay}>
        <Text style={[styles.seconds, urgent && styles.secondsUrgent]}>{seconds}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
  },
  secondsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  seconds: {
    ...TEXT.label,
    color: COLORS.ink,
  },
  secondsUrgent: {
    color: COLORS.danger,
  },
});
