import type { ReactNode } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaperBackground } from "@/components/ui/paper-background";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { Squircle } from "@/components/ui/squircle";
import { PRESS_DEPTH } from "@/components/ui/use-press-sink";
import { COLORS, CONTROL_SQUARE_SIZE, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

const CARD_TOP_GAP = SPACE.xs;
const ROW_HEIGHT = CONTROL_SQUARE_SIZE + PRESS_DEPTH;
export const HEADER_DIVIDER_HEIGHT = 1;
export const HEADER_TOP_HALF_HEIGHT = SPACE.lg + ROW_HEIGHT + SPACE.md;

// The card reaches under the status bar, so a screen pads for the inset as well as the card.
export function useHeaderCardHeight(collapseHeight: number) {
  return useSafeAreaInsets().top + CARD_TOP_GAP + HEADER_TOP_HALF_HEIGHT + collapseHeight;
}

export type HeaderCardProps = {
  topRow: ReactNode;
  // The collapsing half under the divider; collapseHeight is its full height, divider included.
  children: ReactNode;
  collapseHeight: number;
  scrollOffset: Animated.Value;
  // A screen that washes its paper must wash the status-bar strip the same way.
  mask?: ReactNode;
};

export function HeaderCard({
  topRow,
  children,
  collapseHeight,
  scrollOffset,
  mask,
}: HeaderCardProps) {
  const insets = useSafeAreaInsets();

  const collapse = scrollOffset.interpolate({
    inputRange: [0, collapseHeight],
    outputRange: [0, -collapseHeight],
    extrapolate: "clamp",
  });
  const bridgeOpacity = scrollOffset.interpolate({
    inputRange: [collapseHeight - RADIUS.xl, collapseHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.overlay}>
      {/* Content scrolls up into the status bar, so the paper carries on over it. */}
      <View style={[styles.mask, { height: insets.top + CARD_TOP_GAP }]} pointerEvents="none">
        <PaperBackground />
        {mask}
      </View>
      <View style={styles.band}>
        <View style={styles.stack}>
          <View style={styles.topHalf}>
            <Squircle radius={RADIUS.xl} color={COLORS.card} style={styles.topFace} />
            <View style={styles.row}>{topRow}</View>
          </View>
          {/* Fills the card's bottom corners until the half has gone, so the join reads as one card. */}
          <Animated.View style={[styles.bridge, { opacity: bridgeOpacity }]} pointerEvents="none" />
          <View style={[styles.window, { height: collapseHeight }]}>
            <Animated.View style={{ transform: [{ translateY: collapse }] }}>
              <Squircle radius={RADIUS.base} corners="bottom" color={COLORS.card}>
                <View style={styles.divider} />
                {children}
              </Squircle>
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  mask: {
    width: "100%",
    backgroundColor: COLORS.background,
  },
  band: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: GUTTER,
    pointerEvents: "box-none",
  },
  stack: {
    pointerEvents: "box-none",
  },
  topFace: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  topHalf: {
    height: HEADER_TOP_HALF_HEIGHT,
    paddingTop: SPACE.lg,
    zIndex: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: SPACE.lg,
  },
  bridge: {
    position: "absolute",
    left: 0,
    right: 0,
    top: HEADER_TOP_HALF_HEIGHT - RADIUS.xl,
    height: RADIUS.xl,
    backgroundColor: COLORS.card,
    zIndex: 1,
  },
  window: {
    overflow: "hidden",
  },
  divider: {
    height: HEADER_DIVIDER_HEIGHT,
    backgroundColor: COLORS.divider,
  },
});
