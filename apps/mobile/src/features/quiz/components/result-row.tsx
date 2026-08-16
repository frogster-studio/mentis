import { Grid2x2, Pencil } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { RESULTS_CANONICAL_LABEL, RESULTS_NO_ANSWER } from "@/features/quiz/constants";
import type { SessionAnswer } from "@/features/quiz/session-reducer";
import type { Question } from "@/types/quiz";
import { COLORS } from "@/utils/colors";

export type ResultRowProps = {
  question: Question;
  answer: SessionAnswer;
};

export function ResultRow({ question, answer }: ResultRowProps) {
  const typed = answer.input.trim();
  const isEmpty = typed === "";
  const playerAnswer = isEmpty ? RESULTS_NO_ANSWER : answer.input;
  // Reveal the Canonical Answer unless verbatim, so a typo'd correct answer shows the spelling.
  const showCanonical = typed !== question.answer;
  const ModeIcon = answer.mode === "square" ? Grid2x2 : Pencil;
  const accent = answer.correct ? COLORS.green500 : COLORS.red500;

  return (
    <View style={[styles.card, answer.correct ? styles.cardCorrect : styles.cardWrong]}>
      <View style={styles.head}>
        <Text style={styles.question}>{question.text}</Text>
        <View style={[styles.chip, answer.correct ? styles.chipCorrect : styles.chipWrong]}>
          <Text style={styles.chipText}>{answer.points > 0 ? `+${answer.points}` : "0"}</Text>
        </View>
      </View>
      <View style={styles.answerRow}>
        <ModeIcon color={accent} size={18} />
        <Text style={[styles.answer, isEmpty && styles.answerEmpty]}>{playerAnswer}</Text>
      </View>
      {showCanonical ? (
        <Text style={styles.canonical}>
          {RESULTS_CANONICAL_LABEL} {question.answer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cardCorrect: {
    backgroundColor: COLORS.green50,
  },
  cardWrong: {
    backgroundColor: COLORS.red50,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  question: {
    flex: 1,
    color: COLORS.fill,
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 22,
  },
  chip: {
    borderRadius: 999,
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
  },
  chipCorrect: {
    backgroundColor: COLORS.green500,
  },
  chipWrong: {
    backgroundColor: COLORS.red500,
  },
  chipText: {
    color: COLORS.fillOpposite,
    fontSize: 14,
    fontWeight: "bold",
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  answer: {
    flex: 1,
    color: COLORS.fill,
    fontSize: 15,
  },
  answerEmpty: {
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  canonical: {
    color: COLORS.fill,
    fontSize: 14,
  },
});
