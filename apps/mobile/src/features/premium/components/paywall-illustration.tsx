import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Squircle } from "@/components/ui/squircle";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const LOCK = require("../../../../assets/images/premium-lock.png");

const BLOCK_HEIGHT = 150;
const LOCK_WIDTH = 89;
const LOCK_HEIGHT = 120;
const LOCK_TOP = 6;
const PILL_WIDTH = 119;
const PILL_HEIGHT = 35;
const PILL_EYE_SIZE = PILL_HEIGHT - SPACE.xxs * 2;
const PILL_WASH_OPACITY = 0.6;

// The scatter is measured off the mockup, so each blob keeps its own drift and tilt.
const SCATTERED_PILLS = [
  { left: "28%", top: 41, rotate: "-3.73deg" },
  { left: "69%", top: 28, rotate: "4.96deg" },
  { left: "18%", top: 80, rotate: "6.55deg" },
  { left: "82%", top: 79, rotate: "-7.12deg" },
  { left: "30%", top: 128, rotate: "-7.23deg" },
  { left: "72%", top: 128, rotate: "6.55deg" },
] as const;

export const PaywallIllustration = () => {
  return (
    <View style={styles.block}>
      {SCATTERED_PILLS.map((pill) => (
        <Squircle
          key={`${pill.left}-${pill.top}`}
          radius={RADIUS.sm}
          corners="all"
          color={COLORS.primarySunken}
          borderColor={null}
          borderWidth={null}
          style={[
            styles.pill,
            { left: pill.left, top: pill.top, transform: [{ rotate: pill.rotate }] },
          ]}
        >
          <View style={styles.pillEye} />
        </Squircle>
      ))}
      <Image source={LOCK} style={styles.lock} contentFit="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    height: BLOCK_HEIGHT,
  },
  pill: {
    position: "absolute",
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    marginLeft: -PILL_WIDTH / 2,
    marginTop: -PILL_HEIGHT / 2,
    justifyContent: "center",
    opacity: PILL_WASH_OPACITY,
  },
  pillEye: {
    width: PILL_EYE_SIZE,
    height: PILL_EYE_SIZE,
    marginLeft: SPACE.xxs,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
  },
  lock: {
    alignSelf: "center",
    marginTop: LOCK_TOP,
    width: LOCK_WIDTH,
    height: LOCK_HEIGHT,
  },
});
