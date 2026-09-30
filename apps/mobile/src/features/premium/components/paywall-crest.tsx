import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { LogoMark } from "@/components/logo-mark";
import { Squircle } from "@/components/ui/squircle";
import { LaurelBranch } from "@/features/premium/components/laurel-branch";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const CROWN = require("../../../../assets/images/premium-crown.png");

const CROWN_WIDTH = 90;
const CROWN_HEIGHT = 42;
const CROWN_BADGE_OVERLAP = 7;
const LAUREL_WIDTH = 42;
const LAUREL_HEIGHT = 77;
const BADGE_MARK_SIZE = 38;
const BADGE_HEIGHT = 70;

export const PAYWALL_CREST_HEIGHT = CROWN_HEIGHT - CROWN_BADGE_OVERLAP + BADGE_HEIGHT;

export const PaywallCrest = () => {
  return (
    <View style={styles.crest}>
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
      <View style={styles.crownSlot}>
        <Image source={CROWN} style={styles.crown} contentFit="contain" />
      </View>

      <Text style={styles.badgeLabel}>Premium</Text>
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
    top: -SPACE.xs,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  crown: {
    width: CROWN_WIDTH,
    aspectRatio: 252 / 159,
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
    height: BADGE_HEIGHT,
    aspectRatio: 3 / 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeLabel: {
    textTransform: "uppercase",
    ...TEXT.premiumLabel,
  },
});
