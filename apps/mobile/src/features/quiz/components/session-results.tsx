import { Pressable, StyleSheet, Text } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { ResultCard } from "@/features/quiz/components/result-card";
import { ResultsScreen } from "@/features/quiz/components/results-screen";
import { RESULTS_HOME_LABEL, RESULTS_REPLAY_LABEL } from "@/features/quiz/constants";
import { type SessionAnswer, sessionScore } from "@/features/quiz/session-reducer";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";
import type { Question } from "@/types/quiz";

const HOME_LINK_HEIGHT = TEXT.label.lineHeight + SPACE.md * 2;

export interface SessionResultsProps {
  themeName: string;
  questions: Question[];
  answers: SessionAnswer[];
  onReplay: () => void;
  onGoHome: () => void;
}

export const SessionResults = ({
  themeName,
  questions,
  answers,
  onReplay,
  onGoHome,
}: SessionResultsProps) => {
  return (
    <ResultsScreen
      score={sessionScore(answers)}
      themeName={themeName}
      outcomes={answers.map((answer) => answer.correct)}
      footer={
        <>
          <NewButton
            layout="block"
            shape="full"
            tone="primary"
            icon="play-circle-outline"
            label={RESULTS_REPLAY_LABEL}
            accessibilityLabel={null}
            onPress={onReplay}
            disabled={false}
            pending={false}
          />
          <Pressable
            style={({ pressed }) => [styles.homeLink, pressed && styles.pressed]}
            onPress={onGoHome}
          >
            <Text style={styles.homeLabel}>{RESULTS_HOME_LABEL}</Text>
          </Pressable>
        </>
      }
    >
      {questions.map((question, index) => (
        <ResultCard
          key={question.id}
          position={index + 1}
          total={questions.length}
          questionText={question.text}
          canonicalAnswer={question.answer}
          answerText={answers[index].input}
          correct={answers[index].correct}
          points={answers[index].points}
        />
      ))}
    </ResultsScreen>
  );
};

const styles = StyleSheet.create({
  homeLink: {
    height: HOME_LINK_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: PRESSED,
  homeLabel: {
    ...TEXT.label,
    color: COLORS.ink,
    textDecorationLine: "underline",
  },
});
