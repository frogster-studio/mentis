import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";
import { gradient } from "@/utils/gradient";

export interface AnecdoteSheetProps {
  color: string;
}

export const AnecdoteSheet = ({ children, color }: PropsWithChildren<AnecdoteSheetProps>) => {
  return (
    <FastSquircleView
      style={[
        styles.sheet,
        { ...gradient(`radial-gradient(farthest-corner at 50% 150%, ${color}, ${color})`) },
      ]}
    >
      {children}
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  sheet: {
    padding: SPACE.lg,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.stroke,
  },
});
