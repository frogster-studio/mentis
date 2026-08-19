import { useRef, useState } from "react";
import { Animated, type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurBand } from "@/components/ui/blur-band";
import { BUTTON_BOX_HEIGHT, Button } from "@/components/ui/button";
import { ScreenContainer } from "@/components/ui/screen-container";
import { ResultCard } from "@/features/quiz/components/result-card";
import {
  ResultsHeaderBand,
  useResultsBandHeight,
} from "@/features/quiz/components/results-header-band";
import {
  RESULTS_HOME_LABEL,
  RESULTS_REPLAY_LABEL,
  RESULTS_SCORE_MAX_LABEL,
} from "@/features/quiz/constants";
import { type SessionAnswer, sessionScore } from "@/features/quiz/session-reducer";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, PRESSED, SPACE } from "@/theme/tokens";
import type { Question } from "@/types/quiz";

// Both bands pad their own inset, so the screen under them must not spend either one twice.
const RESULTS_EDGES = ["left", "right"] as const;
const HOME_LINK_HEIGHT = TEXT.label.lineHeight + SPACE.md * 2;
const FOOTER_BAND_HEIGHT = BUTTON_BOX_HEIGHT + HOME_LINK_HEIGHT + SPACE.md * 2;
// The scroll the handover spans, and the half of it the band alone owns.
const SWAP_TRAVEL = SPACE.xxl;
const HANDOVER = SPACE.lg;

export type SessionResultsProps = {
  themeName: string;
  questions: Question[];
  answers: SessionAnswer[];
  onReplay: () => void;
  onGoHome: () => void;
};

export function SessionResults({
  themeName,
  questions,
  answers,
  onReplay,
  onGoHome,
}: SessionResultsProps) {
  const insets = useSafeAreaInsets();
  const bandHeight = useResultsBandHeight();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerHeight, setHeaderHeight] = useState(0);
  const score = sessionScore(answers);

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
    <ScreenContainer edges={RESULTS_EDGES}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: FOOTER_BAND_HEIGHT + insets.bottom },
        ]}
      >
        <Animated.View
          style={[styles.header, { paddingTop: insets.top + SPACE.xl, opacity: headerOpacity }]}
          onLayout={(event: LayoutChangeEvent) => setHeaderHeight(event.nativeEvent.layout.height)}
        >
          <View style={styles.scoreBlock}>
            <Text style={styles.score}>{score}</Text>
            <Text style={styles.scoreMax}>{RESULTS_SCORE_MAX_LABEL}</Text>
          </View>
          <Text style={styles.theme}>{themeName}</Text>
        </Animated.View>
        {questions.map((question, index) => (
          <ResultCard key={question.id} question={question} answer={answers[index]} />
        ))}
      </Animated.ScrollView>
      {/* After the list in JSX: expo-blur only blurs what mounted before it. */}
      <Animated.View style={[styles.bandLayer, { opacity: bandOpacity }]} pointerEvents="box-none">
        <ResultsHeaderBand score={score} themeName={themeName} />
      </Animated.View>
      <BlurBand edge="bottom">
        <View style={[styles.footer, { paddingBottom: SPACE.md + insets.bottom }]}>
          <Button label={RESULTS_REPLAY_LABEL} onPress={onReplay} />
          <Pressable
            style={({ pressed }) => [styles.homeLink, pressed && styles.pressed]}
            onPress={onGoHome}
          >
            <Text style={styles.homeLabel}>{RESULTS_HOME_LABEL}</Text>
          </Pressable>
        </View>
      </BlurBand>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: GUTTER,
    gap: SPACE.md,
  },
  header: {
    alignItems: "center",
    gap: SPACE.md,
    paddingBottom: SPACE.xl,
  },
  scoreBlock: {
    alignItems: "center",
  },
  score: {
    ...TEXT.heroScore,
    color: COLORS.primary,
  },
  // The numeral reserves descent space no digit ever uses, so the ceiling climbs back into it.
  scoreMax: {
    ...TEXT.caption,
    marginTop: -SPACE.xl,
    color: COLORS.inkMuted,
  },
  theme: {
    ...TEXT.screenTitle,
    color: COLORS.inkMuted,
    textAlign: "center",
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
  homeLink: {
    height: HOME_LINK_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: PRESSED,
  homeLabel: {
    ...TEXT.label,
    color: COLORS.inkMuted,
  },
});
