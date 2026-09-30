import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { COLORS, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

export interface CardProps {
  onPress: (() => void) | null;
  background: ReactNode;
}

export const Card = ({ children, onPress, background }: PropsWithChildren<CardProps>) => {
  const surface = (
    <FastSquircleView
      style={[
        styles.container,
        {
          backgroundColor: background === null ? COLORS.card : undefined,
        },
      ]}
    >
      {background}
      <View style={styles.content}>{children}</View>
    </FastSquircleView>
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
  container: { borderRadius: RADIUS.base },
  content: { padding: SPACE.lg },
  pressed: PRESSED,
});
