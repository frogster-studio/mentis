import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { LaurelBranch } from "@/features/premium/components/laurel-branch";
import { PREMIUM_ACTIVE_TITLE, PREMIUM_CTA_LABEL } from "@/features/premium/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_ICON_SIZE, PRESSED, RADIUS, SPACE } from "@/theme/tokens";
import { gradient } from "@/utils/gradient";

const CROWN = require("../../../../assets/images/premium-crown.png");

// The crest is measured off the mockup: the crown sits inside the wreath, not above it.
const CROWN_WIDTH = 110;
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
    ...gradient(`linear-gradient(to top, ${COLORS.yellow}, ${COLORS.primary})`),
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
    top: -SPACE.lg,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  crown: {
    width: CROWN_WIDTH,
    aspectRatio: 252 / 159,
  },
  title: {
    ...TEXT.rowTitle,
    flex: 1,
    color: COLORS.ink,
  },
  pressed: PRESSED,
});
