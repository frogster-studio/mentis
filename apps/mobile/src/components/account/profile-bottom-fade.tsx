import { StyleSheet, View } from "react-native";
import { useBottomTabBarHeight } from "@/components/bottom-tab-bar";
import { COLORS, SPACE } from "@/theme/tokens";
import { gradient } from "@/utils/gradient";

export const ProfileBottomFade = () => {
  const height = useBottomTabBarHeight() + SPACE.lg;

  return <View style={[styles.fade, { height }]} pointerEvents="none" />;
};

const styles = StyleSheet.create({
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    ...gradient(`linear-gradient(to top, ${COLORS.catchupMist}, ${COLORS.catchupMist}00)`),
  },
});
