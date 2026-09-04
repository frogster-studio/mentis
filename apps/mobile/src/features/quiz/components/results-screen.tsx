import { type PropsWithChildren, type ReactNode, useRef, useState } from "react";
import { Animated, type LayoutChangeEvent, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurBand } from "@/components/ui/blur-band";
import { ScreenContainer } from "@/components/ui/screen-container";
import {
  ResultsHeaderBand,
  useResultsBandHeight,
} from "@/features/quiz/components/results-header-band";
import { ResultsHeaderCard } from "@/features/quiz/components/results-header-card";
import { GUTTER, SPACE } from "@/theme/tokens";

// Both bands pad their own inset, so the screen under them must not spend either one twice.
const RESULTS_EDGES = ["left", "right"] as const;
// The scroll the handover spans, and the half of it the band alone owns.
const SWAP_TRAVEL = SPACE.xxl;
const HANDOVER = SPACE.lg;
// Web has no native animated module and warns on every mount; it falls back to JS anyway.
const NATIVE_DRIVER = Platform.OS !== "web";

export interface ResultsScreenProps {
  score: number;
  themeName: string;
  outcomes: boolean[];
  footer: ReactNode;
}

export const ResultsScreen = ({
  score,
  themeName,
  outcomes,
  children,
  footer,
}: PropsWithChildren<ResultsScreenProps>) => {
  const insets = useSafeAreaInsets();
  const bandHeight = useResultsBandHeight();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);

  // The band takes over exactly as the block it replaces reaches it.
  const swapAt = Math.max(headerHeight - bandHeight, SWAP_TRAVEL + 1);
  // The block clears out before the band arrives, so the Theme is never drawn twice at once.
  const headerOpacity = scrollY.interpolate({
    inputRange: [swapAt - SWAP_TRAVEL, swapAt - HANDOVER],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const bandOpacity = scrollY.interpolate({
    inputRange: [swapAt - HANDOVER, swapAt],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <ScreenContainer edges={RESULTS_EDGES} underlay={null}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: NATIVE_DRIVER,
        })}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: footerHeight }]}
      >
        <Animated.View
          style={[styles.header, { paddingTop: insets.top + SPACE.xs, opacity: headerOpacity }]}
          onLayout={(event: LayoutChangeEvent) => setHeaderHeight(event.nativeEvent.layout.height)}
        >
          <ResultsHeaderCard score={score} themeName={themeName} outcomes={outcomes} />
        </Animated.View>
        {children}
      </Animated.ScrollView>
      {/* After the list in JSX: expo-blur only blurs what mounted before it. */}
      <Animated.View style={[styles.bandLayer, { opacity: bandOpacity }]} pointerEvents="box-none">
        <ResultsHeaderBand score={score} themeName={themeName} />
      </Animated.View>
      <BlurBand edge="bottom">
        <View
          style={[styles.footer, { paddingBottom: SPACE.md + insets.bottom }]}
          onLayout={(event: LayoutChangeEvent) => setFooterHeight(event.nativeEvent.layout.height)}
        >
          {footer}
        </View>
      </BlurBand>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: GUTTER,
    gap: SPACE.md,
  },
  header: {
    paddingBottom: SPACE.xs,
  },
  // The band draws its own absolute frame, so this layer only carries the fade.
  bandLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  footer: {
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.md,
  },
});
