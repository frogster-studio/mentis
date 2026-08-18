import type { LucideIcon } from "lucide-react-native";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { PRESS_DEPTH, usePressSink } from "@/components/ui/use-press-sink";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, RADIUS } from "@/theme/tokens";

const QUIET_SHADOW = "#CFCFCF";

const PALETTES = {
  primary: {
    face: "#FBBF24",
    border: "#F59E0B",
    shadow: "#D97706",
    text: "#78350F",
  },
  quiet: {
    face: COLORS.quiet,
    border: COLORS.quiet,
    shadow: QUIET_SHADOW,
    text: COLORS.ink,
  },
  disabled: {
    face: COLORS.quiet,
    border: COLORS.quiet,
    shadow: QUIET_SHADOW,
    text: COLORS.inkMuted,
  },
} as const;

type ButtonBaseProps = {
  onPress: () => void;
  theme?: "primary" | "quiet";
  disabled?: boolean;
};

export type ButtonProps = ButtonBaseProps &
  (
    | { layout?: "block" | "flex"; label: string }
    | { layout: "circle"; icon: LucideIcon; accessibilityLabel: string }
  );

export function Button(props: ButtonProps) {
  const { onPress, theme = "primary", disabled = false } = props;
  const { travel, pressIn, pressOut } = usePressSink();
  const palette = PALETTES[disabled ? "disabled" : theme];
  const isCircle = props.layout === "circle";

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
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
        {props.layout === "circle" ? (
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
  root: { height: CONTROL_HEIGHT + PRESS_DEPTH },
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
