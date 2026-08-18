import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { ScreenContainer } from "@/components/ui/screen-container";
import { ResultRow } from "@/features/quiz/components/result-row";
import { POINTS_CASH, RESULTS_HOME_LABEL, RESULTS_REPLAY_LABEL } from "@/features/quiz/constants";
import { type SessionAnswer, sessionScore } from "@/features/quiz/session-reducer";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED } from "@/theme/tokens";
import type { Question } from "@/types/quiz";

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
  const score = sessionScore(answers);
  const maxScore = POINTS_CASH * questions.length;

  return (
    <ScreenContainer>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.score}>
            {score} / {maxScore}
          </Text>
          <Text style={styles.theme}>{themeName}</Text>
        </View>
        <View style={styles.rows}>
          {questions.map((question, index) => (
            <ResultRow key={question.id} question={question} answer={answers[index]} />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button label={RESULTS_REPLAY_LABEL} onPress={onReplay} />
        <Pressable
          style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}
          onPress={onGoHome}
        >
          <Text style={styles.homeLabel}>{RESULTS_HOME_LABEL}</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  header: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 16,
  },
  score: {
    ...TEXT.heroScore,
    color: COLORS.ink,
  },
  theme: {
    ...TEXT.cardTitle,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
  rows: {
    gap: 12,
  },
  footer: {
    borderTopColor: COLORS.stroke,
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 4,
  },
  homeButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  pressed: PRESSED,
  homeLabel: {
    ...TEXT.label,
    color: COLORS.inkMuted,
  },
});
