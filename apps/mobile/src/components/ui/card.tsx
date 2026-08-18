import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { COLORS, RADIUS, SHADOW, SPACE } from "@/theme/tokens";

export type CardProps = {
  children: ReactNode;
};

export function Card({ children }: CardProps) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.base,
    borderCurve: "continuous",
    boxShadow: SHADOW.card,
    padding: SPACE.lg,
  },
});
