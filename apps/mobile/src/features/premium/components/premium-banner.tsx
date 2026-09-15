import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { LaurelBranch } from "@/features/premium/components/laurel-branch";
import { PaywallHeroGradient } from "@/features/premium/components/paywall-hero-gradient";
import { PREMIUM_ACTIVE_TITLE, PREMIUM_CTA_LABEL } from "@/features/premium/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_ICON_SIZE, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

const CROWN = require("../../../../assets/images/premium-crown.png");

// The crest is measured off the mockup: the crown sits inside the wreath, not above it.
const CROWN_WIDTH = 41;
const CROWN_HEIGHT = 36;
const LAUREL_WIDTH = 34;
const LAUREL_HEIGHT = 61;

export interface PremiumBannerProps {
  isPremium: boolean;
  onPress: () => void;
}

export const PremiumBanner = ({ isPremium, onPress }: PremiumBannerProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={isPremium}
      accessibilityRole="button"
      style={({ pressed }) => pressed && styles.pressed}
    >
      <FastSquircleView style={styles.banner}>
        <PaywallHeroGradient />
        <View style={styles.crest}>
          <View style={styles.wreath}>
            <View style={styles.mirrored}>
              <LaurelBranch color={COLORS.background} width={LAUREL_WIDTH} height={LAUREL_HEIGHT} />
            </View>
            <LaurelBranch color={COLORS.background} width={LAUREL_WIDTH} height={LAUREL_HEIGHT} />
          </View>
          <View style={styles.crownSlot}>
            <Image source={CROWN} style={styles.crown} contentFit="contain" />
          </View>
        </View>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          {isPremium ? PREMIUM_ACTIVE_TITLE : PREMIUM_CTA_LABEL}
        </Text>
        {isPremium ? null : (
          <MaterialIcons name="arrow-forward" size={CONTROL_ICON_SIZE} color={COLORS.ink} />
        )}
      </FastSquircleView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    borderRadius: RADIUS.base,
    overflow: "hidden",
  },
  crest: {
    alignItems: "center",
    justifyContent: "center",
  },
  wreath: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.xxs,
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
  crownSlot: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  crown: {
    width: CROWN_WIDTH,
    height: CROWN_HEIGHT,
  },
  title: {
    ...TEXT.rowTitle,
    flex: 1,
    color: COLORS.ink,
  },
  pressed: PRESSED,
});
