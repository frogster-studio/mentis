import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const WINK = require("../../../../assets/images/onboarding/wink.webp");

export const SurpriseHero = () => {
  return (
    <View style={styles.container}>
      <Image source={WINK} contentFit="contain" style={styles.wink} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  wink: { aspectRatio: 180 / 265, width: "20%" },
});
