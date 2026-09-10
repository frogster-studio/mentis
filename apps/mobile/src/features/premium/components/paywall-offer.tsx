import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { NewButton } from "@/components/ui/new-button";
import { Squircle } from "@/components/ui/squircle";
import { PaywallCrest } from "@/features/premium/components/paywall-crest";
import { PaywallHeroGradient } from "@/features/premium/components/paywall-hero-gradient";
import { PaywallIllustration } from "@/features/premium/components/paywall-illustration";
import {
  PAYWALL_FEATURES,
  PAYWALL_LEGAL_SEPARATOR,
  PAYWALL_PLAN_LABEL,
  PAYWALL_PRICE_PERIOD,
  PAYWALL_PRIVACY_LINK_LABEL,
  PAYWALL_PURCHASE_ERROR,
  PAYWALL_PURCHASE_LABEL,
  PAYWALL_SKIP_LABEL,
  PAYWALL_TERMS_LINK_LABEL,
  PAYWALL_TITLE,
} from "@/features/premium/constants";
import { subscriptionTermsSentence } from "@/features/premium/subscription-terms";
import { PRIVACY_URL, TERMS_URL } from "@/lib/legal-links";
import { openExternalLink } from "@/lib/open-external-link";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

const FEATURE_ICON_SIZE = 24;
const SKIP_TINT = "4D";
const PLAN_LABEL_OVERLAP = SPACE.sm;
// The paywall never shows on web, so anything that is not Android buys through the App Store.
const STORE_PLATFORM = Platform.OS === "android" ? "android" : "ios";

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
          <Text style={styles.terms}>{subscriptionTermsSentence(STORE_PLATFORM)}</Text>

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

          <Text style={styles.links}>
            <Text
              style={styles.link}
              suppressHighlighting
              onPress={() => openExternalLink(TERMS_URL)}
            >
              {PAYWALL_TERMS_LINK_LABEL}
            </Text>
            {` ${PAYWALL_LEGAL_SEPARATOR} `}
            <Text
              style={styles.link}
              suppressHighlighting
              onPress={() => openExternalLink(PRIVACY_URL)}
            >
              {PAYWALL_PRIVACY_LINK_LABEL}
            </Text>
          </Text>
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
  terms: {
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
    ...TEXT.label,
    marginTop: SPACE.lg,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
  link: {
    ...TEXT.label,
    color: COLORS.ink,
    textDecorationLine: "underline",
  },
  pressed: PRESSED,
});
