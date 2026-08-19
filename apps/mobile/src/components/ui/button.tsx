import type { LucideIcon } from "lucide-react-native";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { PRESS_DEPTH, usePressSink } from "@/components/ui/use-press-sink";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, RADIUS } from "@/theme/tokens";

// The sink travels inside the layout box, so chrome around a Button clears this, not CONTROL_HEIGHT.
export const BUTTON_BOX_HEIGHT = CONTROL_HEIGHT + PRESS_DEPTH;

export const QUIET_PALETTE = {
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
  quiet: QUIET_PALETTE,
  disabled: { ...QUIET_PALETTE, text: COLORS.inkMuted },
} as const;

type ButtonBaseProps = {
  onPress: () => void;
  theme?: "primary" | "quiet";
  disabled?: boolean;
  pending?: boolean;
};

export type ButtonProps = ButtonBaseProps &
  (
    | { layout?: "block" | "flex"; label: string }
    | { layout: "circle"; icon: LucideIcon; accessibilityLabel: string }
  );

export function Button(props: ButtonProps) {
  const { onPress, theme = "primary", disabled = false, pending = false } = props;
  const { travel, pressIn, pressOut } = usePressSink();
  const isInert = disabled || pending;
  const palette = PALETTES[isInert ? "disabled" : theme];
  const isCircle = props.layout === "circle";

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={isInert}
      accessibilityRole="button"
      accessibilityLabel={props.layout === "circle" ? props.accessibilityLabel : props.label}
      style={[styles.root, styles[props.layout ?? "block"]]}
    >
      <View style={[styles.shadow, { backgroundColor: palette.shadow }]} />
      <Animated.View
        style={[
          styles.face,
          isCircle && styles.circleFace,
          {
            backgroundColor: palette.face,
            borderColor: palette.border,
            transform: [{ translateY: travel }],
          },
        ]}
      >
        {pending ? (
          <ActivityIndicator size="small" color={palette.text} />
        ) : props.layout === "circle" ? (
          <props.icon size={20} color={palette.text} />
        ) : (
          <Text style={[styles.label, { color: palette.text }]}>{props.label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Holding the travel inside the layout box keeps everything around the button still as it sinks.
  root: { height: BUTTON_BOX_HEIGHT },
  block: { alignSelf: "stretch" },
  flex: { flex: 1 },
  circle: { width: CONTROL_HEIGHT },
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
  circleFace: {
    paddingHorizontal: 0,
  },
  label: {
    ...TEXT.label,
    userSelect: "none",
  },
});
