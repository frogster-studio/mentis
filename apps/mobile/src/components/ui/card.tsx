import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Squircle } from "@/components/ui/squircle";
import { COLORS, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

export interface CardProps {
  onPress: (() => void) | null;
  background: ReactNode;
}

export const Card = ({ children, onPress, background }: PropsWithChildren<CardProps>) => {
  const surface = (
    <Squircle
      radius={RADIUS.base}
      color={background === null ? COLORS.card : null}
      style={null}
      corners="all"
      borderColor={null}
      borderWidth={null}
    >
      {background}
      <View style={styles.card}>{children}</View>
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
};

const styles = StyleSheet.create({
  card: {
    padding: SPACE.lg,
  },
  pressed: PRESSED,
});
