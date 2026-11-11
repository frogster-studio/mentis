import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RESULTS_CANONICAL_LABEL } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

export interface QuestionRecallProps {
  questionText: string;
  canonicalAnswer: string;
}

export const QuestionRecall = ({
  questionText,
  canonicalAnswer,
  children,
}: PropsWithChildren<QuestionRecallProps>) => {
  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.question}>{questionText}</Text>
        {children}
      </View>
      <Text style={styles.canonical}>
        {RESULTS_CANONICAL_LABEL} {canonicalAnswer}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE.md,
  },
  question: {
    ...TEXT.caption,
    flex: 1,
    color: COLORS.inkMuted,
  },
  canonical: {
    ...TEXT.captionStrong,
    marginTop: SPACE.xxs,
    color: COLORS.ink,
  },
});
