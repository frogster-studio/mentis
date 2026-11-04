import { Pressable, StyleSheet, Text } from "react-native";
import { resetAnecdoteDaySet } from "@/features/anecdote/api";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";

const RESET_LABEL = "reset anecdotes";

export const DevResetAnecdotes = () => {
  if (!__DEV__) {
    return null;
  }

  return (
    <Pressable
      onPress={resetAnecdoteDaySet}
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
