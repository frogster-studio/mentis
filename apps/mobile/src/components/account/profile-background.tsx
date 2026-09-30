import { StyleSheet, View } from "react-native";
import { PaperBackground } from "@/components/ui/paper-background";
import { COLORS } from "@/theme/tokens";

export const ProfileBackground = () => {
  return (
    <>
      <PaperBackground isDark={false} />
      <View style={styles.wash} pointerEvents="none" />
    </>
  );
};

const styles = StyleSheet.create({
  wash: { ...StyleSheet.absoluteFill, backgroundColor: `${COLORS.catchup}40` },
});
