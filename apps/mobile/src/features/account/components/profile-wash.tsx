import { StyleSheet, View } from "react-native";
import { COLORS } from "@/theme/tokens";

const WASH_ALPHA = "40";

// The profile paper is the grid washed blue, so every profile surface tints with this one value.
export const PROFILE_WASH = `${COLORS.catchup}${WASH_ALPHA}`;

export const ProfileWash = () => {
  return <View style={[StyleSheet.absoluteFill, styles.wash]} pointerEvents="none" />;
};

const styles = StyleSheet.create({
  wash: {
    backgroundColor: PROFILE_WASH,
  },
});
