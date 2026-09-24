import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { COLORS, RADIUS } from "@/theme/tokens";

const QUESTION_CARD = require("../../../../assets/images/onboarding/question-card.webp");

const SHADOW_LAYERS = [
  { x: 157, y: 136, blur: 58, alphaHex: "03" },
  { x: 100, y: 87, blur: 53, alphaHex: "0F" },
  { x: 56, y: 49, blur: 45, alphaHex: "33" },
  { x: 25, y: 22, blur: 33, alphaHex: "59" },
  { x: 6, y: 5, blur: 18, alphaHex: "66" },
];

const QUESTION_CARD_SHADOW = SHADOW_LAYERS.map(
  ({ x, y, blur, alphaHex }) => `${x}px ${y}px ${blur}px ${COLORS.shadow}${alphaHex}`,
).join(", ");

export const OnboardingQuestionCard = () => {
  return (
    <FastSquircleView style={styles.card}>
      <Image source={QUESTION_CARD} contentFit="contain" style={styles.image} />
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    aspectRatio: 268 / 170.5,
    borderRadius: RADIUS.base,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    boxShadow: QUESTION_CARD_SHADOW,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
