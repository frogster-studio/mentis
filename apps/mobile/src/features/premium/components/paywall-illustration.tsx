import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { SPACE } from "@/theme/tokens";
import { LOCKER_IMAGE, PLACEHOLDER_PILL_IMAGE } from "@/utils/assets";

export const PAYWALL_ILLUSTRATION_HEIGHT = 150;

const SCATTERED_PILLS = [
  { left: "5%", top: 35, rotate: "-3.73deg" },
  { left: "55%", top: 20, rotate: "4.96deg" },
  { left: "-5%", top: 80, rotate: "6.55deg" },
  { left: "70%", top: 70, rotate: "-7.12deg" },
  { left: "10%", top: 128, rotate: "-7.23deg" },
  { left: "60%", top: 128, rotate: "6.55deg" },
] as const;

export const PaywallIllustration = () => {
  return (
    <View style={styles.block}>
      {SCATTERED_PILLS.map((pill) => (
        <View
          key={`${pill.left}-${pill.top}`}
          style={[
            styles.placeholderPillSlot,
            { left: pill.left, top: pill.top, transform: [{ rotate: pill.rotate }] },
          ]}
        >
          <Image
            source={PLACEHOLDER_PILL_IMAGE}
            style={styles.placeholderPillImage}
            contentFit="contain"
          />
        </View>
      ))}

      <View style={styles.lockSlot}>
        <Image source={LOCKER_IMAGE} style={styles.lock} contentFit="contain" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    height: PAYWALL_ILLUSTRATION_HEIGHT,
    position: "relative",
  },
  placeholderPillSlot: {
    position: "absolute",
  },
  lockSlot: { position: "absolute", top: -SPACE.lg, alignSelf: "center" },
  lock: { width: 170, aspectRatio: 627 / 810 },
  placeholderPillImage: {
    width: 120,
    aspectRatio: 357 / 105,
  },
});
