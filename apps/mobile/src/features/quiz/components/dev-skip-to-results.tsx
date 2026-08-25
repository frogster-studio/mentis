// Dev-only: forges a finished session so the results screen is one tap away, recorded like a real one.

import { QuizAnswerModeEnum } from "@mentis/contracts/enums";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { POINTS_CASH } from "@/features/quiz/constants";
import type { SessionAnswer } from "@/features/quiz/session-reducer";
import { useQuizStore } from "@/features/quiz/store";
import { COLORS } from "@/theme/tokens";
import type { Question } from "@/types/quiz";

const CORRECT_COUNTS = [0, 2, 4, 6, 8, 10];
const DEFAULT_CORRECT_COUNT = 4;
const SKIP_LABEL = "go to end";

export function DevSkipToResults() {
  const questions = useQuizStore((state) =>
    state.session?.status === "active" ? state.session.questions : null,
  );
  const [correctCount, setCorrectCount] = useState(DEFAULT_CORRECT_COUNT);

  if (!__DEV__ || !questions) {
    return null;
  }

  return (
    <View style={styles.bar}>
      {CORRECT_COUNTS.map((count) => (
        <Pressable key={count} onPress={() => setCorrectCount(count)} hitSlop={8}>
          <Text style={[styles.count, count === correctCount && styles.countSelected]}>
            {count}
          </Text>
        </Pressable>
      ))}
      <Pressable onPress={() => finishNow(questions, correctCount)} hitSlop={8}>
        <Text style={styles.skip}>{SKIP_LABEL}</Text>
      </Pressable>
    </View>
  );
}

function finishNow(questions: Question[], correctCount: number) {
  useQuizStore.setState((state) =>
    state.session
      ? {
          session: {
            ...state.session,
            answers: forgeAnswers(questions, correctCount),
            status: "finished",
          },
        }
      : {},
  );
}

// Every answer is Cash, so the score is exactly correctCount × POINTS_CASH.
function forgeAnswers(questions: Question[], correctCount: number): SessionAnswer[] {
  const indexes = questions.map((_, index) => index);
  const size = Math.min(correctCount, indexes.length);
  for (let i = 0; i < size; i += 1) {
    const j = i + Math.floor(Math.random() * (indexes.length - i));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  const correct = new Set(indexes.slice(0, size));
  return questions.map((question, index) =>
    correct.has(index)
      ? {
          input: question.answer,
          correct: true,
          points: POINTS_CASH,
          mode: QuizAnswerModeEnum.CASH,
        }
      : {
          input: question.wrongChoices[0] ?? "",
          correct: false,
          points: 0,
          mode: QuizAnswerModeEnum.CASH,
        },
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 10,
    opacity: 0.5,
  },
  count: {
    color: COLORS.inkMuted,
    fontSize: 12,
    fontWeight: "bold",
  },
  countSelected: {
    color: COLORS.primary,
  },
  skip: {
    color: COLORS.inkMuted,
    fontSize: 12,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
