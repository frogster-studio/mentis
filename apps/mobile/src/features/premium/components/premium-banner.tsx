import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { LaurelBranch } from "@/features/premium/components/laurel-branch";
import { PaywallHeroGradient } from "@/features/premium/components/paywall-hero-gradient";
import { PREMIUM_ACTIVE_TITLE, PREMIUM_CTA_LABEL } from "@/features/premium/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_ICON_SIZE, SPACE } from "@/theme/tokens";

const CROWN = require("../../../../assets/images/premium-crown.png");

const CROWN_WIDTH = 40;
const CROWN_HEIGHT = 35;
const LAUREL_WIDTH = 30;
const LAUREL_HEIGHT = 54;

export interface PremiumBannerProps {
  isPremium: boolean;
  onPress: () => void;
}

export const PremiumBanner = ({ isPremium, onPress }: PremiumBannerProps) => {
  return (
    <Card background={<PaywallHeroGradient />} onPress={isPremium ? null : onPress}>
      <View style={styles.row}>
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
        <Text style={styles.title}>{isPremium ? PREMIUM_ACTIVE_TITLE : PREMIUM_CTA_LABEL}</Text>
        {isPremium ? null : (
          <MaterialIcons name="arrow-forward" size={CONTROL_ICON_SIZE} color={COLORS.ink} />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
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
});
