import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { COMPETITION_STREAK_LABEL } from "@/features/competition/constants";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const FLAME_IMAGE = require("../../../../assets/images/competition/flame.png");

interface StreakBadgeProps {
  streak: number;
}

export const StreakBadge = ({ streak }: StreakBadgeProps) => {
  return (
    <View
      style={styles.container}
      pointerEvents="none"
      accessibilityLabel={COMPETITION_STREAK_LABEL}
    >
      <FastSquircleView style={styles.badge}>
        <Text style={styles.text}>{streak}</Text>
      </FastSquircleView>

      <Image source={FLAME_IMAGE} contentFit="contain" style={styles.image} accessible={false} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: "absolute", right: SPACE.md, top: SPACE.sm },
  badge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.scrim,
    borderRadius: RADIUS.sm,
    height: 42,
    minWidth: 42,
    paddingHorizontal: SPACE.sm,
  },
  text: { ...TEXT.statValue, color: COLORS.face, transform: [{ rotate: "-6deg" }] },
  image: {
    position: "absolute",
    aspectRatio: 219 / 249,
    height: "200%",
    top: -42,
    right: -40,
    transform: [{ rotate: "6deg" }],
  },
});
