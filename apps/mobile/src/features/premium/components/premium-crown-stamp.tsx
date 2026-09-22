import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { TEXT } from "@/theme/text";
import { SPACE } from "@/theme/tokens";

const CROWN_IMAGE = require("../../../../assets/images/premium-crown.png");

export const PremiumCrownStamp = () => {
  return (
    <View style={styles.container}>
      <Image
        source={CROWN_IMAGE}
        contentFit="contain"
        style={styles.image}
        pointerEvents="none"
        accessible={false}
      />
      <FastSquircleView style={styles.labelContainer}>
        <Text style={styles.label}>Premium</Text>
      </FastSquircleView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", transform: [{ rotate: "6deg" }] },
  image: { width: 80, aspectRatio: 252 / 159, marginBottom: -SPACE.sm, zIndex: 1 },
  labelContainer: {
    borderRadius: 4,
    backgroundColor: "#FEE24F",
    padding: SPACE.xxs,
    paddingTop: SPACE.xs,
  },
  label: { ...TEXT.premiumLabel, textTransform: "uppercase", paddingHorizontal: SPACE.xxs },
});
