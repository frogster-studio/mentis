import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { RefObject } from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";
import SquircleView from "react-native-fast-squircle";
import { NewButton } from "@/components/ui/new-button";
import { ANSWER_PLACEHOLDER, CONFIRM_LABEL, SQUARE_SWITCH_LABEL } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, CONTROL_ICON_SIZE, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

export interface CashAnswerFooterProps {
  input: string;
  // Held by the screen, which blurs the field before raising the quit sheet.
  inputRef: RefObject<TextInput | null>;
  autoFocus: boolean;
  disabled: boolean;
  onInputChange: (value: string) => void;
  onSwitchToSquare: () => void;
  onConfirm: () => void;
}

export const CashAnswerFooter = ({
  input,
  inputRef,
  autoFocus,
  disabled,
  onInputChange,
  onSwitchToSquare,
  onConfirm,
}: CashAnswerFooterProps) => {
  return (
    <View style={styles.footer}>
      <SquircleView style={styles.inputShell}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={input}
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
      </SquircleView>
      <NewButton
        layout="hug"
        shape="full"
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
        shape="full"
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
    borderWidth: 1,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.face,
    borderColor: COLORS.ink,
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
});
