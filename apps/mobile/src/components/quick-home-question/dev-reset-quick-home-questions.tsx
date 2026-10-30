import { Pressable, StyleSheet, Text } from "react-native";
import { resetQuickHomeQuestionDaySet } from "@/features/quick-home-question/api";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";

const RESET_LABEL = "reset quick home questions";

export const DevResetQuickHomeQuestions = () => {
  if (!__DEV__) {
    return null;
  }

  return (
    <Pressable
      onPress={resetQuickHomeQuestionDaySet}
      hitSlop={SPACE.sm}
      style={({ pressed }) => [styles.root, pressed && PRESSED]}
    >
      <Text style={styles.label}>{RESET_LABEL}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: { alignSelf: "center", padding: SPACE.lg },
  label: { ...TEXT.caption, color: COLORS.inkMuted, textDecorationLine: "underline" },
});
