import { Image } from "expo-image";
import { StyleSheet, Text } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import {
  ONBOARDING_LEADER_POINTS,
  ONBOARDING_LEADER_PSEUDO,
} from "@/features/onboarding/constants";
import { POINTS_UNIT } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const LEADER_AVATAR = require("../../../../assets/images/onboarding/leader-avatar.webp");

const SHADOW_LAYERS = [
  { x: 0, y: 182, blur: 51, alphaHex: "03" },
  { x: 0, y: 116, blur: 47, alphaHex: "12" },
  { x: 0, y: 65, blur: 39, alphaHex: "40" },
  { x: 0, y: 29, blur: 29, alphaHex: "6B" },
  { x: 0, y: 7, blur: 16, alphaHex: "7D" },
];

const LEADER_CARD_SHADOW = SHADOW_LAYERS.map(
  ({ x, y, blur, alphaHex }) => `${x}px ${y}px ${blur}px ${COLORS.shadow}${alphaHex}`,
).join(", ");

export const OnboardingLeaderCard = () => {
  return (
    <FastSquircleView style={styles.card}>
      <Image source={LEADER_AVATAR} contentFit="contain" style={styles.avatar} />
      <Text style={styles.pseudo} numberOfLines={1}>
        {ONBOARDING_LEADER_PSEUDO}
      </Text>
      <Text style={styles.points}>{`${ONBOARDING_LEADER_POINTS} ${POINTS_UNIT}`}</Text>
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.face,
    boxShadow: LEADER_CARD_SHADOW,
  },
  avatar: {
    height: SPACE.xxl,
    aspectRatio: 145 / 160,
    transform: [{ scaleX: -1 }],
  },
  pseudo: {
    ...TEXT.screenTitle,
    color: COLORS.ink,
    flex: 1,
  },
  points: {
    ...TEXT.captionStrong,
    color: COLORS.ink,
  },
});
