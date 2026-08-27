import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { TRANSFER_DONE_DISMISS_LABEL, TRANSFER_DONE_HOME } from "@/features/account/constants";
import { useTransferStore } from "@/features/quiz/transfer-store";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, PRESSED, SPACE } from "@/theme/tokens";

const DISMISS_ICON_SIZE = 20;

export function TransferNotice() {
  const dismissNotice = useTransferStore((state) => state.dismissNotice);

  return (
    <View style={styles.notice}>
      <Text style={styles.message}>{TRANSFER_DONE_HOME}</Text>
      <Pressable
        onPress={dismissNotice}
        accessibilityLabel={TRANSFER_DONE_DISMISS_LABEL}
        hitSlop={SPACE.sm}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <MaterialIcons name="close" size={DISMISS_ICON_SIZE} color={COLORS.inkMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    backgroundColor: COLORS.quiet,
    paddingHorizontal: GUTTER,
    paddingVertical: SPACE.md,
  },
  message: {
    ...TEXT.caption,
    flex: 1,
    color: COLORS.ink,
  },
  pressed: PRESSED,
});
