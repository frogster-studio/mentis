import { ActivityIndicator, StyleSheet, View } from "react-native";
import { COLORS, GUTTER } from "@/theme/tokens";

export function ScreenLoading() {
  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: GUTTER,
  },
});
