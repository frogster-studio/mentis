import { StyleSheet, Text, View } from "react-native";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { PAYWALL_ACTIVATION_MESSAGE } from "@/features/premium/constants";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

export const PremiumActivation = () => {
  return (
    <View style={styles.root}>
      <ScreenLoading />
      <Text style={styles.message}>{PAYWALL_ACTIVATION_MESSAGE}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    paddingVertical: SPACE.lg,
    gap: SPACE.lg,
  },
  message: {
    ...TEXT.body,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
});
