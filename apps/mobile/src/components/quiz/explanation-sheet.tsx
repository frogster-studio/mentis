import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { QuestionRecall } from "@/components/quiz/question-recall";
import { EmphasizedText } from "@/components/ui/emphasized-text";
import { Sheet } from "@/components/ui/sheet";
import { EXPLANATION_MISSING, EXPLANATION_TITLE } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

export interface ExplainedQuestion {
  questionText: string;
  canonicalAnswer: string;
  explanation: string | null;
}

export interface ExplanationSheetProps {
  question: ExplainedQuestion | null;
  onDismiss: () => void;
}

export const ExplanationSheet = ({ question, onDismiss }: ExplanationSheetProps) => {
  // The sheet keeps drawing the last Question while it slides away, so its height never jumps.
  const [shown, setShown] = useState(question);
  if (question !== null && question !== shown) {
    setShown(question);
  }

  return (
    <Sheet
      visible={question !== null}
      isBare={false}
      title={EXPLANATION_TITLE}
      message={null}
      dismissible
      onDismiss={onDismiss}
    >
      {shown ? (
        <>
          <QuestionRecall
            questionText={shown.questionText}
            canonicalAnswer={shown.canonicalAnswer}
          />
          <View style={styles.hairline} />
          {shown.explanation === null ? (
            <Text style={styles.missing}>{EXPLANATION_MISSING}</Text>
          ) : (
            <EmphasizedText text={shown.explanation} />
          )}
        </>
      ) : null}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  // Bleeds past the sheet's padding, so the recall and the Explanation read as two rows.
  hairline: {
    height: 1,
    marginVertical: SPACE.xs,
    marginHorizontal: -SPACE.xl,
    backgroundColor: COLORS.stroke,
  },
  missing: {
    ...TEXT.anecdote,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
});
