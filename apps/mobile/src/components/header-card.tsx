import type { PropsWithChildren, ReactNode } from "react";
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

export interface HeaderCardProps {
  topRow: ReactNode;
  // The full height of the collapsing half under the divider, divider included.
  collapseHeight: number;
  scrollOffset: Animated.Value;
  // A screen that washes its paper must wash the header's paper the same way.
  mask: ReactNode;
}

export const HeaderCard = ({
  topRow,
  children,
  collapseHeight,
  scrollOffset,
  mask,
}: PropsWithChildren<HeaderCardProps>) => {
  const cardTop = useSafeAreaInsets().top + CARD_TOP_GAP;

  const collapse = scrollOffset.interpolate({
    inputRange: [0, collapseHeight],
    outputRange: [0, -collapseHeight],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.overlay}>
      {/* Content scrolls under the card, so the paper carries on over the band and hides it. */}
      <View style={[styles.paper, { height: cardTop + HEADER_TOP_HALF_HEIGHT }]}>
        <PaperBackground />
        {mask}
      </View>
      <View style={[styles.card, { marginTop: cardTop }]}>
        <View style={styles.topHalf}>
          <Squircle
            radius={RADIUS.xl}
            color={COLORS.card}
            style={styles.face}
            corners="all"
            borderColor={null}
            borderWidth={null}
          />
          <View style={styles.row}>{topRow}</View>
        </View>
        {/* Runs under the face's corners, so the card reads as one while the half slides away. */}
        <View style={styles.titleWindow}>
          <Animated.View style={{ transform: [{ translateY: collapse }] }}>
            <Squircle
              radius={RADIUS.base}
              corners="bottom"
              color={COLORS.card}
              borderColor={null}
              borderWidth={null}
              style={styles.titleHalf}
            >
              <View style={styles.divider} />
              {children}
            </Squircle>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  paper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    pointerEvents: "none",
  },
  card: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: GUTTER,
    pointerEvents: "box-none",
  },
  topHalf: {
    height: HEADER_TOP_HALF_HEIGHT,
    paddingTop: SPACE.lg,
    zIndex: 1,
  },
  face: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: SPACE.lg,
  },
  titleWindow: {
    marginTop: -RADIUS.xl,
    overflow: "hidden",
    pointerEvents: "none",
  },
  titleHalf: {
    paddingTop: RADIUS.xl,
  },
  divider: {
    height: HEADER_DIVIDER_HEIGHT,
    backgroundColor: COLORS.divider,
  },
});
