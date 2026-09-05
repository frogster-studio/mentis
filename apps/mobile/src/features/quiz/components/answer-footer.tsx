import { QuizAnswerModeEnum } from "@mentis/contracts/enums";
import type { RefObject } from "react";
import type { TextInput } from "react-native";
import { CashAnswerFooter } from "@/features/quiz/components/cash-answer-footer";
import { SquareAnswerFooter } from "@/features/quiz/components/square-answer-footer";
import { hasStandingAnswer, type QuestionPlay } from "@/features/quiz/question-play";

export interface AnswerFooterProps {
  play: QuestionPlay;
  categoryColor: string;
  inputRef: RefObject<TextInput | null>;
  autoFocus: boolean;
  onInputChange: (value: string) => void;
  onSwitchToSquare: () => void;
  onSelect: (index: number) => void;
  onConfirm: () => void;
}

// Two component types: the mode swap remounts, so no LayoutAnimation can morph one footer into the other.
export const AnswerFooter = ({
  play,
  categoryColor,
  inputRef,
  autoFocus,
  onInputChange,
  onSwitchToSquare,
  onSelect,
  onConfirm,
}: AnswerFooterProps) => {
  const disabled = !hasStandingAnswer(play);

  if (play.mode === QuizAnswerModeEnum.SQUARE && play.choices) {
    return (
      <SquareAnswerFooter
        choices={play.choices}
        selection={play.selection}
        categoryColor={categoryColor}
        disabled={disabled}
        onSelect={onSelect}
        onConfirm={onConfirm}
      />
    );
  }

  return (
    <CashAnswerFooter
      input={play.input}
      inputRef={inputRef}
      autoFocus={autoFocus}
      disabled={disabled}
      onInputChange={onInputChange}
      onSwitchToSquare={onSwitchToSquare}
      onConfirm={onConfirm}
    />
  );
};
