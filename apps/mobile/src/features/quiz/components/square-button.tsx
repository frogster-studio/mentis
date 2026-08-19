import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { QUIET_PALETTE } from "@/components/ui/button";
import { PRESS_DEPTH, usePressSink } from "@/components/ui/use-press-sink";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const MIN_HEIGHT = 72;

export type SquareButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function SquareButton({ label, selected, onPress }: SquareButtonProps) {
  const { travel, pressIn, pressOut } = usePressSink();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={styles.root}
    >
      <View style={styles.shadow} />
      <Animated.View
        style={[
          styles.face,
          selected && styles.faceSelected,
          { transform: [{ translateY: travel }] },
        ]}
      >
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Holding the travel inside the layout box keeps the grid still as the face sinks.
  root: {
    flexGrow: 1,
    flexBasis: "45%",
    paddingBottom: PRESS_DEPTH,
  },
  shadow: {
    position: "absolute",
    top: PRESS_DEPTH,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: QUIET_PALETTE.shadow,
    borderRadius: RADIUS.base,
    borderCurve: "continuous",
  },
  face: {
    flexGrow: 1,
    minHeight: MIN_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACE.md,
    backgroundColor: QUIET_PALETTE.face,
    borderColor: QUIET_PALETTE.border,
    borderWidth: 2,
    borderRadius: RADIUS.base,
    borderCurve: "continuous",
  },
  faceSelected: {
    borderColor: COLORS.primary,
  },
  label: {
    ...TEXT.label,
    color: QUIET_PALETTE.text,
    textAlign: "center",
    userSelect: "none",
  },
});
