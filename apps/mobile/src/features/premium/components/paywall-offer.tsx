import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as WebBrowser from "expo-web-browser";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { NewButton } from "@/components/ui/new-button";
import { Squircle } from "@/components/ui/squircle";
import { PaywallCrest } from "@/features/premium/components/paywall-crest";
import { PaywallHeroGradient } from "@/features/premium/components/paywall-hero-gradient";
import { PaywallIllustration } from "@/features/premium/components/paywall-illustration";
import {
  PAYWALL_CONTACT_LABEL,
  PAYWALL_FEATURES,
  PAYWALL_LINK_URL,
  PAYWALL_PLAN_LABEL,
  PAYWALL_PRICE_PERIOD,
  PAYWALL_PURCHASE_ERROR,
  PAYWALL_PURCHASE_LABEL,
  PAYWALL_RENEWAL_NOTICE,
  PAYWALL_SKIP_LABEL,
  PAYWALL_TERMS_LABEL,
  PAYWALL_TITLE,
} from "@/features/premium/constants";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

const FEATURE_ICON_SIZE = 24;
const SKIP_TINT = "4D";
const PLAN_LABEL_OVERLAP = SPACE.sm;

// Web has no in-app sheet, and expo-web-browser opens a cramped popup window there instead of a tab.
function openLink() {
  if (Platform.OS === "web") {
    void Linking.openURL(PAYWALL_LINK_URL);
    return;
  }
  void WebBrowser.openBrowserAsync(PAYWALL_LINK_URL);
}

export interface PaywallOfferProps {
  pack: PurchasesPackage;
  purchaseFailed: boolean;
  isPurchasing: boolean;
  onSkip: () => void;
  onPurchase: () => void;
}

export const PaywallOffer = ({
  pack,
  purchaseFailed,
  isPurchasing,
  onSkip,
  onPurchase,
}: PaywallOfferProps) => {
  return (
    <>
      <Squircle
        radius={RADIUS.xl}
        corners="all"
        color={COLORS.primary}
        borderColor={null}
        borderWidth={null}
        style={styles.hero}
      >
        <PaywallHeroGradient />
        <Pressable
          style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
          disabled={isPurchasing}
          onPress={onSkip}
        >
          <Text style={styles.skipLabel}>{PAYWALL_SKIP_LABEL}</Text>
        </Pressable>

        <PaywallCrest />
        <Text style={styles.title}>{PAYWALL_TITLE}</Text>

        <View style={styles.features}>
          {PAYWALL_FEATURES.map((feature) => (
            <View key={feature} style={styles.feature}>
              <MaterialIcons
                name="check-circle-outline"
                size={FEATURE_ICON_SIZE}
                color={COLORS.ink}
              />
              <Text style={styles.featureLabel}>{feature}</Text>
            </View>
          ))}
        </View>

        <PaywallIllustration />
      </Squircle>

      <View style={styles.plan}>
        <Squircle
          radius={RADIUS.sm}
          corners="all"
          color={COLORS.ink}
          borderColor={null}
          borderWidth={null}
          style={styles.planLabel}
        >
          <Text style={styles.planLabelText}>{PAYWALL_PLAN_LABEL}</Text>
        </Squircle>

        <Squircle
          radius={RADIUS.xl}
          corners="all"
          color={COLORS.card}
          borderColor={null}
          borderWidth={null}
          style={styles.priceCard}
        >
          <View style={styles.price}>
            <Text style={styles.priceValue}>{pack.product.priceString}</Text>
            <Text style={styles.pricePeriod}>{PAYWALL_PRICE_PERIOD}</Text>
          </View>
          <Text style={styles.renewal}>{PAYWALL_RENEWAL_NOTICE}</Text>

          {purchaseFailed ? <Text style={styles.error}>{PAYWALL_PURCHASE_ERROR}</Text> : null}

          <View style={styles.cta}>
            <NewButton
              layout="block"
              shape="full"
              tone="default"
              label={PAYWALL_PURCHASE_LABEL}
              icon="arrow-right"
              accessibilityLabel={null}
              disabled={false}
              pending={isPurchasing}
              onPress={onPurchase}
            />
          </View>

          <View style={styles.links}>
            <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={openLink}>
              <Text style={styles.link}>{PAYWALL_TERMS_LABEL}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={openLink}>
              <Text style={styles.link}>{PAYWALL_CONTACT_LABEL}</Text>
            </Pressable>
          </View>
        </Squircle>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  hero: {
    borderRadius: RADIUS.xl,
    borderCurve: "continuous",
    paddingTop: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.xl,
  },
  skip: {
    position: "absolute",
    top: SPACE.sm,
    right: SPACE.sm,
    zIndex: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    backgroundColor: `${COLORS.face}${SKIP_TINT}`,
  },
  skipLabel: {
    ...TEXT.label,
    color: COLORS.ink,
  },
  title: {
    ...TEXT.sectionTitle,
    marginTop: SPACE.xl,
    color: COLORS.ink,
    textAlign: "center",
  },
  features: {
    marginTop: SPACE.xl,
    gap: SPACE.sm,
  },
  feature: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE.sm,
  },
  featureLabel: {
    ...TEXT.body,
    flex: 1,
    color: COLORS.ink,
  },
  plan: {
    marginTop: SPACE.sm,
    alignItems: "center",
  },
  planLabel: {
    zIndex: 1,
    marginBottom: -PLAN_LABEL_OVERLAP,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xs,
  },
  planLabelText: {
    ...TEXT.label,
    color: COLORS.face,
    textTransform: "uppercase",
  },
  priceCard: {
    alignSelf: "stretch",
    paddingTop: SPACE.xl,
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.lg,
  },
  price: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: SPACE.xs,
  },
  priceValue: {
    ...TEXT.statValue,
    color: COLORS.ink,
  },
  pricePeriod: {
    ...TEXT.body,
    color: COLORS.inkMuted,
  },
  renewal: {
    ...TEXT.caption,
    marginTop: SPACE.xxs,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
  error: {
    ...TEXT.body,
    marginTop: SPACE.sm,
    color: COLORS.danger,
    textAlign: "center",
  },
  cta: {
    marginTop: SPACE.lg,
  },
  links: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACE.lg,
    gap: SPACE.xxl,
  },
  link: {
    ...TEXT.label,
    color: COLORS.ink,
    textDecorationLine: "underline",
  },
  pressed: PRESSED,
});
