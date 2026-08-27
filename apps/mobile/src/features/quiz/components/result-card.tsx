import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { QuizAnswerModeEnum } from "@mentis/contracts/enums";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { RESULTS_CANONICAL_LABEL, RESULTS_NO_ANSWER } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

const MENU_ICON_SIZE = 20;
const MODE_ICON_SIZE = 16;
const CHIP_SIZE = 32;

export type ResultCardProps = {
  questionText: string;
  canonicalAnswer: string;
  answerText: string;
  mode: QuizAnswerModeEnum;
  correct: boolean;
  points: number;
};

export function ResultCard({
  questionText,
  canonicalAnswer,
  answerText,
  mode,
  correct,
  points,
}: ResultCardProps) {
  const isEmpty = answerText.trim() === "";
  const modeGlyph = mode === QuizAnswerModeEnum.SQUARE ? "grid-view" : "edit";
  const accent = correct ? COLORS.success : COLORS.danger;

  return (
    <Card>
      <View style={styles.body}>
        <View style={styles.head}>
          <Text style={styles.question}>{questionText}</Text>
          <Pressable style={({ pressed }) => pressed && styles.pressed} hitSlop={8}>
            <MaterialIcons name="more-vert" size={MENU_ICON_SIZE} color={COLORS.inkMuted} />
          </Pressable>
        </View>
        <Text style={styles.canonical}>
          {RESULTS_CANONICAL_LABEL} {canonicalAnswer}
        </Text>
        <View style={styles.divider} />
        <View style={styles.answerRow}>
          <MaterialIcons name={modeGlyph} size={MODE_ICON_SIZE} color={accent} />
          <Text style={[styles.answer, isEmpty && styles.answerEmpty]}>
            {isEmpty ? RESULTS_NO_ANSWER : answerText}
          </Text>
          <View style={[styles.chip, { backgroundColor: accent }]}>
            <Text style={styles.chipText}>{points > 0 ? `+${points}` : "0"}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: SPACE.xs,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE.md,
  },
  question: {
    ...TEXT.cardTitleSmall,
    flex: 1,
    color: COLORS.ink,
  },
  pressed: PRESSED,
  canonical: {
    ...TEXT.caption,
    color: COLORS.ink,
  },
  divider: {
    height: 1,
    marginVertical: SPACE.sm,
    backgroundColor: COLORS.stroke,
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
  },
  answer: {
    ...TEXT.caption,
    flex: 1,
    color: COLORS.ink,
  },
  answerEmpty: {
    color: COLORS.inkMuted,
  },
  chip: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    ...TEXT.label,
    color: COLORS.card,
  },
});
