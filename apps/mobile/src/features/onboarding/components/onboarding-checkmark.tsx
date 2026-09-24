import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { COLORS, RADIUS } from "@/theme/tokens";

const CHECKMARK = require("../../../../assets/images/onboarding/checkmark.webp");

const CHECKMARK_WIDTH = 48;

const SHADOW_LAYERS = [
  { y: 138, blur: 39, alphaHex: "05" },
  { y: 89, blur: 35, alphaHex: "26" },
  { y: 50, blur: 30, alphaHex: "80" },
  { y: 22, blur: 22, alphaHex: "D9" },
  { y: 6, blur: 12, alphaHex: "FA" },
];

const CHECKMARK_SHADOW = SHADOW_LAYERS.map(
  ({ y, blur, alphaHex }) => `0px ${y}px ${blur}px ${COLORS.successShadow}${alphaHex}`,
).join(", ");

export const OnboardingCheckmark = () => {
  return (
    <FastSquircleView style={styles.checkmark}>
      <Image source={CHECKMARK} contentFit="contain" style={styles.image} />
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  checkmark: {
    width: CHECKMARK_WIDTH,
    aspectRatio: 171 / 174,
    borderRadius: RADIUS.sm,
    boxShadow: CHECKMARK_SHADOW,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
