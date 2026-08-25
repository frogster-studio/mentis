import { QuizAnswerModeEnum } from "@mentis/contracts/enums";
import type { RefObject } from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { SquareButton } from "@/features/quiz/components/square-button";
import { ANSWER_PLACEHOLDER, CONFIRM_LABEL, SQUARE_SWITCH_LABEL } from "@/features/quiz/constants";
import { hasStandingAnswer, type QuestionPlay } from "@/features/quiz/question-play";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

export type AnswerFooterProps = {
  play: QuestionPlay;
  // Held by the screen, which blurs the field before raising the quit sheet.
  inputRef: RefObject<TextInput | null>;
  autoFocus: boolean;
  onInputChange: (value: string) => void;
  onSwitchToSquare: () => void;
  onSelect: (index: number) => void;
  onConfirm: () => void;
};

export function AnswerFooter({
  play,
  inputRef,
  autoFocus,
  onInputChange,
  onSwitchToSquare,
  onSelect,
  onConfirm,
}: AnswerFooterProps) {
  const disabled = !hasStandingAnswer(play);

  if (play.mode === QuizAnswerModeEnum.SQUARE && play.choices) {
    return (
      <View style={styles.squareFooter}>
        <View style={styles.grid}>
          {play.choices.map((choice, index) => (
            <SquareButton
              key={choice}
              label={choice}
              selected={play.selection === index}
              onPress={() => onSelect(index)}
            />
          ))}
        </View>
        <Button label={CONFIRM_LABEL} onPress={onConfirm} disabled={disabled} />
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={play.input}
        onChangeText={onInputChange}
        // Web: Enter keeps focus (RN-web blurs on submit); native only dismisses.
        onSubmitEditing={() => (Platform.OS === "web" ? onConfirm() : inputRef.current?.blur())}
        // Both spellings: RN-web honors only blurOnSubmit, native only submitBehavior.
        blurOnSubmit={false}
        submitBehavior="submit"
        placeholder={ANSWER_PLACEHOLDER}
        placeholderTextColor={COLORS.inkMuted}
        // A Carré question advancing behind the sheet remounts this field, keyboard and all.
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />
      <Button
        layout="circle"
        icon="grid-view"
        accessibilityLabel={SQUARE_SWITCH_LABEL}
        onPress={onSwitchToSquare}
        theme="quiet"
      />
      <Button
        layout="circle"
        icon="check"
        accessibilityLabel={CONFIRM_LABEL}
        onPress={onConfirm}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Top-aligned so the input lines up with the buttons' faces, leaving their plates below it.
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE.md,
    paddingHorizontal: GUTTER,
    paddingBottom: SPACE.md,
  },
  // Without minWidth the web input never shrinks past min-content and pushes the buttons out.
  input: {
    flex: 1,
    minWidth: 0,
    height: CONTROL_HEIGHT,
    backgroundColor: COLORS.quiet,
    borderColor: COLORS.stroke,
    borderWidth: 1,
    ...TEXT.body,
    borderRadius: RADIUS.base,
    paddingHorizontal: SPACE.lg,
    color: COLORS.ink,
  },
  squareFooter: {
    gap: SPACE.md,
    paddingHorizontal: GUTTER,
    paddingBottom: SPACE.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACE.md,
  },
});
