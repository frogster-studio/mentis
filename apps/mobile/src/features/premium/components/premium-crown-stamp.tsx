import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { TEXT } from "@/theme/text";
import { SPACE } from "@/theme/tokens";
import { CROWN_IMAGE } from "@/utils/assets";

export const PremiumCrownStamp = () => {
  return (
    <FastSquircleView style={styles.labelContainer}>
      <View style={styles.crownSlot}>
        <Image
          source={CROWN_IMAGE}
          contentFit="contain"
          style={styles.image}
          pointerEvents="none"
          accessible={false}
        />
      </View>

      <Text style={styles.label}>Premium</Text>
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  crownSlot: {
    position: "absolute",
    top: -SPACE.xxl,
    alignSelf: "center",
  },
  image: {
    width: 80,
    aspectRatio: 333 / 273,
    marginBottom: -SPACE.sm,
  },
  labelContainer: {
    borderRadius: 4,
    backgroundColor: "#FEE24F",
    padding: SPACE.xxs,
    paddingTop: SPACE.xs,
  },
  label: { ...TEXT.premiumLabel, textTransform: "uppercase", paddingHorizontal: SPACE.xxs },
});
