import { StyleSheet, View } from "react-native";
import { COLORS } from "@/theme/tokens";

export const ProfileWash = () => {
  return <View style={styles.wash} pointerEvents="none" />;
};

const styles = StyleSheet.create({
  wash: { ...StyleSheet.absoluteFill, backgroundColor: `${COLORS.catchup}40` },
});
