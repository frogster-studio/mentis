import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { COLORS, PRESSED, RADIUS, SHADOW, SPACE } from "@/theme/tokens";

export type CardProps = {
  children: ReactNode;
  onPress?: () => void;
};

export function Card({ children, onPress }: CardProps) {
  if (!onPress) {
    return <View style={styles.card}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.base,
    borderCurve: "continuous",
    boxShadow: SHADOW.card,
    padding: SPACE.lg,
  },
  pressed: PRESSED,
});
