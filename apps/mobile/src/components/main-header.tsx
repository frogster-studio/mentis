import type { PropsWithChildren, ReactNode } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MAIN_SUB_HEADER_VISIBLE_HEIGHT } from "@/components/main-sub-header";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";
import { gradient } from "@/utils/gradient";

const MAIN_HEADER_HEIGHT = 90;
const MAIN_HEADER_TOP_GAP = SPACE.sm;

// The header floats over the scenes, so a scene pads its content by this.
export function useMainHeaderHeight() {
  return (
    useSafeAreaInsets().top +
    MAIN_HEADER_TOP_GAP +
    MAIN_HEADER_HEIGHT +
    MAIN_SUB_HEADER_VISIBLE_HEIGHT
  );
}

interface MainHeaderProps {
  isDark: boolean;
  subHeader: ReactNode;
}

export const MainHeader = ({ isDark, subHeader, children }: PropsWithChildren<MainHeaderProps>) => (
  <SafeAreaView edges={["top"]} style={styles.header}>
    <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
    <PaperFade isDark={isDark} />

    <FastSquircleView style={styles.bar}>{children}</FastSquircleView>

    {subHeader}
  </SafeAreaView>
);

interface PaperFadeProps {
  isDark: boolean;
}

// Matches the paper under the scenes, so content scrolling up fades into the page itself.
const PaperFade = ({ isDark }: PaperFadeProps) => {
  const { top } = useSafeAreaInsets();
  const paperColor = isDark ? COLORS.ink : COLORS.background;

  return (
    <>
      <View style={[styles.fadeSolid, { height: top + SPACE.lg, backgroundColor: paperColor }]} />
      <View
        style={[
          styles.fadeGradient,
          {
            top: top + SPACE.lg,
            height: MAIN_HEADER_HEIGHT - SPACE.lg,
            ...gradient(`linear-gradient(to bottom, ${paperColor}, ${paperColor}00)`),
          },
        ]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: { position: "absolute", top: 0, left: 0, right: 0 },
  fadeSolid: { position: "absolute", top: 0, left: 0, right: 0 },
  fadeGradient: { position: "absolute", left: 0, right: 0 },
  bar: {
    height: MAIN_HEADER_HEIGHT,
    marginHorizontal: SPACE.sm,
    marginTop: MAIN_HEADER_TOP_GAP,
    padding: SPACE.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.base,
    flexDirection: "row",
    alignItems: "center",
  },
});
