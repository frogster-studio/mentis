import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { RADIUS, SPACE } from "@/theme/tokens";

export interface AnecdoteSheetProps {
  color: string;
}

export const AnecdoteSheet = ({ children, color }: PropsWithChildren<AnecdoteSheetProps>) => {
  return (
    <FastSquircleView style={[styles.sheet, { backgroundColor: color }]}>
      {children}
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  sheet: { padding: SPACE.lg, borderRadius: RADIUS.base },
});
