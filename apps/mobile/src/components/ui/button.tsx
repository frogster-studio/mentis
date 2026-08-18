import type { LucideIcon } from "lucide-react-native";
import { useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { RADIUS } from "@/theme/tokens";

const HEIGHT = 52;
const DEPTH = 6;
const PUSH_MS = 70;
const RELEASE_MS = 180;
// Under this, a quick tap releases before the eye ever registers the face going down.
const MIN_HOLD_MS = 90;
const PUSH_EASING = Easing.bezier(0.4, 0, 1, 1);
const RELEASE_EASING = Easing.bezier(0.16, 1, 0.3, 1);
// Web has no native animated module and warns on every press; it falls back to JS anyway.
const NATIVE_DRIVER = Platform.OS !== "web";

const PALETTES = {
  amber: {
    face: "#fbbf24",
    border: "#f59e0b",
    shadow: "#d97706",
    text: "#78350f",
  },
  neutral: {
    face: "#f1f5f9",
    border: "#e2e8f0",
    shadow: "#cbd5e1",
    text: "#334155",
  },
  ghost: {
    face: "transparent",
    border: "transparent",
    shadow: "transparent",
    text: "#64748b",
  },
  disabled: {
    face: "#e2e8f0",
    border: "#e2e8f0",
    shadow: "#cbd5e1",
    text: "#94a3b8",
  },
} as const;

type ButtonBaseProps = {
  onPress: () => void;
  theme?: "amber" | "neutral" | "ghost";
  disabled?: boolean;
};

export type ButtonProps = ButtonBaseProps &
  (
    | { layout?: "block" | "flex"; label: string }
    | { layout: "circle"; icon: LucideIcon; accessibilityLabel: string }
  );

export function Button(props: ButtonProps) {
  const { onPress, theme = "amber", disabled = false } = props;
  const travel = useRef(new Animated.Value(0)).current;
  const pressedAt = useRef(0);
  const palette = PALETTES[disabled ? "disabled" : theme];
  const isCircle = props.layout === "circle";

  const pressIn = () => {
    pressedAt.current = Date.now();
    Animated.timing(travel, {
      toValue: DEPTH,
      duration: PUSH_MS,
      easing: PUSH_EASING,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  const pressOut = () => {
    Animated.timing(travel, {
      toValue: 0,
      duration: RELEASE_MS,
      delay: Math.max(0, MIN_HOLD_MS - (Date.now() - pressedAt.current)),
      easing: RELEASE_EASING,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

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
  root: { height: HEIGHT + DEPTH },
  block: { alignSelf: "stretch" },
  flex: { flex: 1 },
  circle: { width: HEIGHT },
  shadow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: HEIGHT,
    borderRadius: RADIUS.base,
    borderCurve: "continuous",
  },
  face: {
    height: HEIGHT,
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
    fontSize: 16,
    fontWeight: "bold",
    userSelect: "none",
  },
});
