import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/ui/screen-container";
import { Squircle } from "@/components/ui/squircle";
import { PlayProgressBar } from "@/features/quiz/components/play-progress-bar";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

// The Reveal's wash carried into the session: the Category colour with a hex alpha appended.
const BACKDROP_ALPHA = "38";

export type PlayScreenProps = {
  questionText: string;
  position: number;
  total: number;
  categoryColor: string;
  header: ReactNode;
  footer: ReactNode;
};

export function PlayScreen({
  questionText,
  position,
  total,
  categoryColor,
  header,
  footer,
}: PlayScreenProps) {
  return (
    <ScreenContainer
      underlay={
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `${categoryColor}${BACKDROP_ALPHA}` },
          ]}
        />
      }
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Squircle radius={RADIUS.xl} corners="top" color={COLORS.card} style={styles.cardTop} />
          <Squircle
            radius={RADIUS.base}
            corners="bottom"
            color={COLORS.card}
            style={styles.cardBottom}
          />
          {header}
          <View style={styles.progress}>
            <PlayProgressBar position={position} total={total} />
          </View>
          <Text style={styles.counter}>{`# ${position} / ${total}`}</Text>
          <Text style={styles.questionText}>{questionText}</Text>
        </View>
        <View style={styles.flex} />
        {footer}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    marginHorizontal: GUTTER,
    marginTop: SPACE.xs,
    paddingBottom: SPACE.xxl,
  },
  cardTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: RADIUS.base,
  },
  cardBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: RADIUS.base * 2,
  },
  progress: {
    marginTop: SPACE.md,
  },
  counter: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
    marginTop: SPACE.xl,
    paddingHorizontal: SPACE.lg,
  },
  questionText: {
    ...TEXT.question,
    color: COLORS.ink,
    marginTop: SPACE.sm,
    paddingHorizontal: SPACE.lg,
  },
});
