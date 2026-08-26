import { SquircleView } from "expo-squircle-view";
import type { ReactNode } from "react";
import {
  type ColorValue,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

// The library ships an empty <div> for web, so the browser build falls back to a plain radius.
const IS_WEB = Platform.OS === "web";

// Figma's own corner smoothing runs to 100; anything less stops matching the mockup.
const CORNER_SMOOTHING = 100;

export type SquircleProps = {
  children?: ReactNode;
  radius: number;
  corners?: "all" | "top" | "bottom";
  color?: ColorValue;
  borderColor?: ColorValue;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export function Squircle({
  children,
  radius,
  corners = "all",
  color,
  borderColor,
  borderWidth,
  style,
}: SquircleProps) {
  const overhang =
    corners === "top" ? { bottom: -radius } : corners === "bottom" ? { top: -radius } : null;

  return (
    <View style={[styles.clip, style]}>
      {IS_WEB ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            overhang,
            styles.continuous,
            {
              backgroundColor: color,
              borderColor,
              borderWidth,
              borderRadius: radius,
            },
          ]}
        />
      ) : (
        <SquircleView
          style={[StyleSheet.absoluteFill, overhang]}
          cornerSmoothing={CORNER_SMOOTHING}
          borderRadius={radius}
          backgroundColor={color}
          borderColor={borderColor}
          borderWidth={borderWidth}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  continuous: { borderCurve: "continuous" },
});
