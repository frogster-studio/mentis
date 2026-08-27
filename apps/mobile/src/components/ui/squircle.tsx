import { SquircleView } from "expo-squircle-view";
import type { PropsWithChildren } from "react";
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

export interface SquircleProps {
  radius: number;
  corners: "all" | "top" | "bottom";
  color: ColorValue | null;
  borderColor: ColorValue | null;
  borderWidth: number | null;
  style: StyleProp<ViewStyle>;
}

export const Squircle = ({
  children,
  radius,
  corners,
  color,
  borderColor,
  borderWidth,
  style,
}: PropsWithChildren<SquircleProps>) => {
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
              backgroundColor: color ?? undefined,
              borderColor: borderColor ?? undefined,
              borderWidth: borderWidth ?? undefined,
              borderRadius: radius,
            },
          ]}
        />
      ) : (
        <SquircleView
          style={[StyleSheet.absoluteFill, overhang]}
          cornerSmoothing={CORNER_SMOOTHING}
          borderRadius={radius}
          backgroundColor={color ?? undefined}
          borderColor={borderColor ?? undefined}
          borderWidth={borderWidth ?? undefined}
        />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  continuous: { borderCurve: "continuous" },
});
