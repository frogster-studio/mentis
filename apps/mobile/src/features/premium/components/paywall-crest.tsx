import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { LogoMark } from "@/components/logo-mark";
import { Squircle } from "@/components/ui/squircle";
import { LaurelBranch } from "@/features/premium/components/laurel-branch";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const CROWN = require("../../../../assets/images/premium-crown.png");

const CROWN_WIDTH = 48;
const CROWN_HEIGHT = 42;
const CROWN_BADGE_OVERLAP = 7;
const LAUREL_WIDTH = 42;
const LAUREL_HEIGHT = 77;
const BADGE_WIDTH = 64;
const BADGE_HEIGHT = 81;
const BADGE_MARK_SIZE = 40;

export const PaywallCrest = () => {
  return (
    <View style={styles.crest}>
      <View style={styles.crownSlot}>
        <Image source={CROWN} style={styles.crown} contentFit="contain" />
      </View>
      <View style={styles.wreath}>
        <View style={styles.mirrored}>
          <LaurelBranch color={COLORS.background} width={LAUREL_WIDTH} height={LAUREL_HEIGHT} />
        </View>
        <Squircle
          radius={RADIUS.lg}
          corners="all"
          color={COLORS.ink}
          borderColor={null}
          borderWidth={null}
          style={styles.badge}
        >
          <LogoMark color={COLORS.background} size={BADGE_MARK_SIZE} />
        </Squircle>
        <LaurelBranch color={COLORS.background} width={LAUREL_WIDTH} height={LAUREL_HEIGHT} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  crest: {
    alignItems: "center",
    paddingTop: CROWN_HEIGHT - CROWN_BADGE_OVERLAP,
  },
  crownSlot: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  crown: {
    width: CROWN_WIDTH,
    height: CROWN_HEIGHT,
  },
  wreath: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.xs,
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
  badge: {
    width: BADGE_WIDTH,
    height: BADGE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
});
