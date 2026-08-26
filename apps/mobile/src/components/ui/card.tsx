import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Squircle } from "@/components/ui/squircle";
import { COLORS, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

export type CardProps = {
  children: ReactNode;
  onPress?: () => void;
};

export function Card({ children, onPress }: CardProps) {
  const surface = (
    <Squircle radius={RADIUS.base} color={COLORS.card} style={styles.card}>
      {children}
    </Squircle>
  );

  if (!onPress) {
    return surface;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => pressed && styles.pressed}
    >
      {surface}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACE.lg,
  },
  pressed: PRESSED,
});
