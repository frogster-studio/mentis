import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMutation } from "@tanstack/react-query";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { QuietButton } from "@/components/ui/quiet-button";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { Sheet } from "@/components/ui/sheet";
import {
  awaitPremiumActivation,
  purchasePremium,
  usePremiumOffering,
} from "@/features/premium/api";
import { PremiumActivation } from "@/features/premium/components/premium-activation";
import {
  PAYWALL_ACTIVATION_CLOSE_LABEL,
  PAYWALL_ACTIVATION_PENDING,
  PAYWALL_ACTIVATION_TITLE,
  PAYWALL_FEATURES,
  PAYWALL_LEGAL_SEPARATOR,
  PAYWALL_OFFERING_EMPTY,
  PAYWALL_OFFERING_ERROR,
  PAYWALL_PRICE_PERIOD,
  PAYWALL_PRIVACY_LINK_LABEL,
  PAYWALL_PURCHASE_ERROR,
  PAYWALL_PURCHASE_LABEL,
  PAYWALL_RESTORE_EMPTY,
  PAYWALL_RESTORE_ERROR,
  PAYWALL_RESTORE_LABEL,
  PAYWALL_RESTORE_PENDING_LABEL,
  PAYWALL_TERMS_LINK_LABEL,
  PAYWALL_TITLE,
} from "@/features/premium/constants";
import { isPremiumActive } from "@/features/premium/entitlement";
import { subscriptionTermsSentence } from "@/features/premium/subscription-terms";
import { PRIVACY_URL, TERMS_URL } from "@/lib/legal-links";
import { openExternalLink } from "@/lib/open-external-link";
import { restorePurchases } from "@/lib/purchases";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";

const FEATURE_ICON_SIZE = 18;
// The paywall never shows on web, so anything that is not Android buys through the App Store.
const STORE_PLATFORM = Platform.OS === "android" ? "android" : "ios";

export interface PaywallSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export const PaywallSheet = ({ visible, onDismiss }: PaywallSheetProps) => {
  const offering = usePremiumOffering(visible);
  const activation = useMutation({
    mutationFn: awaitPremiumActivation,
    onSuccess: (isActive) => {
      if (isActive) {
        close();
      }
    },
  });
  const purchase = useMutation({
    mutationFn: purchasePremium,
    onSuccess: (info) => {
      if (info) {
        activation.mutate();
      }
    },
  });
  const restore = useMutation({
    mutationFn: restorePurchases,
    onSuccess: (info) => {
      if (isPremiumActive(info)) {
        activation.mutate();
      }
    },
  });

  function close() {
    purchase.reset();
    restore.reset();
    activation.reset();
    onDismiss();
  }

  const pack = offering.data ?? null;
  const isBusy = purchase.isPending || restore.isPending || activation.isPending;
  const restoreFoundNothing = restore.isSuccess && !isPremiumActive(restore.data);
  // The webhook can outlast the wait: the Player leaves on a notice, never on a failure.
  const activationOutranTheWait = activation.isSuccess && !activation.data;

  return (
    <Sheet
      visible={visible}
      title={
        activation.isPending || activationOutranTheWait ? PAYWALL_ACTIVATION_TITLE : PAYWALL_TITLE
      }
      message={null}
      // Nothing dismisses mid-purchase, nor while the activation is still being awaited.
      dismissible={!isBusy}
      onDismiss={close}
    >
      {activation.isPending ? (
        <PremiumActivation />
      ) : activationOutranTheWait ? (
        <View style={styles.body}>
          <Text style={styles.notice}>{PAYWALL_ACTIVATION_PENDING}</Text>
          <QuietButton
            layout="block"
            label={PAYWALL_ACTIVATION_CLOSE_LABEL}
            icon={null}
            accessibilityLabel={null}
            disabled={false}
            onPress={close}
          />
        </View>
      ) : offering.isPending ? (
        <ScreenLoading />
      ) : offering.isError ? (
        <ScreenError message={PAYWALL_OFFERING_ERROR} onRetry={() => offering.refetch()} />
      ) : pack === null ? (
        // An offering with no package is store configuration, so retrying it can only fail again.
        <ScreenError message={PAYWALL_OFFERING_EMPTY} onRetry={null} />
      ) : (
        <View style={styles.body}>
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

          <View style={styles.price}>
            <Text style={styles.priceValue}>{pack.product.priceString}</Text>
            <Text style={styles.pricePeriod}>{PAYWALL_PRICE_PERIOD}</Text>
          </View>

          {purchase.isError ? <Text style={styles.error}>{PAYWALL_PURCHASE_ERROR}</Text> : null}
          {restore.isError ? <Text style={styles.error}>{PAYWALL_RESTORE_ERROR}</Text> : null}
          {restoreFoundNothing ? <Text style={styles.notice}>{PAYWALL_RESTORE_EMPTY}</Text> : null}

          <NewButton
            layout="block"
            shape="rounded"
            tone="primary"
            label={PAYWALL_PURCHASE_LABEL}
            icon={null}
            accessibilityLabel={null}
            disabled={restore.isPending}
            pending={purchase.isPending}
            onPress={() => purchase.mutate(pack)}
          />

          <Pressable
            style={({ pressed }) => [styles.restore, pressed && styles.pressed]}
            disabled={isBusy}
            onPress={() => restore.mutate()}
          >
            <Text style={styles.restoreLabel}>
              {restore.isPending ? PAYWALL_RESTORE_PENDING_LABEL : PAYWALL_RESTORE_LABEL}
            </Text>
          </Pressable>

          <View style={styles.legal}>
            <Text style={styles.terms}>{subscriptionTermsSentence(STORE_PLATFORM)}</Text>
            <Text style={styles.terms}>
              <Text
                style={styles.legalLink}
                suppressHighlighting
                onPress={() => openExternalLink(TERMS_URL)}
              >
                {PAYWALL_TERMS_LINK_LABEL}
              </Text>
              {` ${PAYWALL_LEGAL_SEPARATOR} `}
              <Text
                style={styles.legalLink}
                suppressHighlighting
                onPress={() => openExternalLink(PRIVACY_URL)}
              >
                {PAYWALL_PRIVACY_LINK_LABEL}
              </Text>
            </Text>
          </View>
        </View>
      )}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: SPACE.md,
    marginTop: SPACE.lg,
  },
  features: {
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
  error: {
    ...TEXT.body,
    color: COLORS.danger,
    textAlign: "center",
  },
  notice: {
    ...TEXT.body,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
  pressed: PRESSED,
  restore: {
    paddingVertical: SPACE.sm,
    alignItems: "center",
  },
  restoreLabel: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
  },
  legal: {
    gap: SPACE.xs,
  },
  terms: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
  legalLink: {
    ...TEXT.captionStrong,
    color: COLORS.ink,
  },
});
