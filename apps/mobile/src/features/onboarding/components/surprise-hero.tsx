import { Image } from "expo-image";
import { StyleSheet } from "react-native";

const WINK = require("../../../../assets/images/onboarding/wink.webp");

export const SurpriseHero = () => {
  return <Image source={WINK} contentFit="contain" style={styles.wink} />;
};

const styles = StyleSheet.create({
  wink: { aspectRatio: 180 / 265, width: "17%" },
});
