import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { QuizAnswerModeEnum } from "@mentis/contracts/enums";
import type { RefObject } from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { Squircle } from "@/components/ui/squircle";
import { SquareButton } from "@/features/quiz/components/square-button";
import { ANSWER_PLACEHOLDER, CONFIRM_LABEL, SQUARE_SWITCH_LABEL } from "@/features/quiz/constants";
import { hasStandingAnswer, type QuestionPlay } from "@/features/quiz/question-play";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, CONTROL_ICON_SIZE, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

export interface AnswerFooterProps {
  play: QuestionPlay;
  // Held by the screen, which blurs the field before raising the quit sheet.
  inputRef: RefObject<TextInput | null>;
  autoFocus: boolean;
  onInputChange: (value: string) => void;
  onSwitchToSquare: () => void;
  onSelect: (index: number) => void;
  onConfirm: () => void;
}

export const AnswerFooter = ({
  play,
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
        <View style={styles.confirmSlot}>
          <NewButton
            layout="block"
            shape="full"
            tone="default"
            icon="arrow-right"
            label={CONFIRM_LABEL}
            accessibilityLabel={null}
            onPress={onConfirm}
            disabled={disabled}
            pending={false}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <Squircle
        radius={RADIUS.base}
        color={COLORS.face}
        borderColor={COLORS.ink}
        borderWidth={1}
        style={styles.inputShell}
        corners="all"
      >
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={play.input}
          onChangeText={onInputChange}
          onSubmitEditing={() => (Platform.OS === "web" ? onConfirm() : inputRef.current?.blur())}
          blurOnSubmit={false}
          submitBehavior="submit"
          placeholder={ANSWER_PLACEHOLDER}
          placeholderTextColor={COLORS.inkMuted}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        <MaterialCommunityIcons
          name="microphone-outline"
          size={CONTROL_ICON_SIZE}
          color={COLORS.ink}
          style={styles.mic}
        />
      </Squircle>
      <NewButton
        layout="hug"
        shape="rounded"
        tone="default"
        icon="grid-large"
        label={null}
        accessibilityLabel={SQUARE_SWITCH_LABEL}
        onPress={onSwitchToSquare}
        disabled={false}
        pending={false}
      />
      <NewButton
        layout="hug"
        shape="rounded"
        tone="primary"
        icon="arrow-right"
        label={null}
        accessibilityLabel={CONFIRM_LABEL}
        onPress={onConfirm}
        disabled={disabled}
        pending={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE.md,
    paddingHorizontal: GUTTER,
    paddingBottom: SPACE.md,
  },
  inputShell: {
    flex: 1,
    minWidth: 0,
    height: CONTROL_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    paddingLeft: SPACE.lg,
    ...TEXT.body,
    color: COLORS.ink,
  },
  mic: {
    marginHorizontal: SPACE.md,
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
  confirmSlot: {
    paddingHorizontal: SPACE.lg,
  },
});
