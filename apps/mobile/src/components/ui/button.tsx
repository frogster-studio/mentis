import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { PRESS_DEPTH, usePressSink } from "@/components/ui/use-press-sink";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, RADIUS } from "@/theme/tokens";

// The sink travels inside the layout box, so chrome around a Button clears this, not CONTROL_HEIGHT.
export const BUTTON_BOX_HEIGHT = CONTROL_HEIGHT + PRESS_DEPTH;

const QUIET_PALETTE = {
  face: COLORS.quiet,
  border: COLORS.quiet,
  shadow: "#CFCFCF",
  text: COLORS.ink,
} as const;

const PALETTES = {
  primary: {
    face: "#FBBF24",
    border: "#F59E0B",
    shadow: "#D97706",
    text: "#78350F",
  },
  disabled: { ...QUIET_PALETTE, text: COLORS.inkMuted },
} as const;

export interface ButtonProps {
  onPress: () => void;
  label: string;
  pending: boolean;
}

export const Button = ({ onPress, label, pending }: ButtonProps) => {
  const { travel, pressIn, pressOut } = usePressSink();
  const palette = PALETTES[pending ? "disabled" : "primary"];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={pending}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.root}
    >
      <View style={[styles.shadow, { backgroundColor: palette.shadow }]} />
      <Animated.View
        style={[
          styles.face,
          {
            backgroundColor: palette.face,
            borderColor: palette.border,
            transform: [{ translateY: travel }],
          },
        ]}
      >
        {pending ? (
          <ActivityIndicator size="small" color={palette.text} />
        ) : (
          <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // Holding the travel inside the layout box keeps everything around the button still as it sinks.
  root: { height: BUTTON_BOX_HEIGHT, alignSelf: "stretch" },
  shadow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: CONTROL_HEIGHT,
    borderRadius: RADIUS.base,
    borderCurve: "continuous",
  },
  face: {
    height: CONTROL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: RADIUS.base,
    borderCurve: "continuous",
    borderWidth: 2,
  },
  label: {
    ...TEXT.label,
    userSelect: "none",
  },
});
