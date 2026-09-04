import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMutation } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { Sheet } from "@/components/ui/sheet";
import { purchasePremium, usePremiumOffering } from "@/features/premium/api";
import {
  PAYWALL_FEATURES,
  PAYWALL_OFFERING_EMPTY,
  PAYWALL_OFFERING_ERROR,
  PAYWALL_PRICE_PERIOD,
  PAYWALL_PURCHASE_ERROR,
  PAYWALL_PURCHASE_LABEL,
  PAYWALL_RESTORE_EMPTY,
  PAYWALL_RESTORE_ERROR,
  PAYWALL_RESTORE_LABEL,
  PAYWALL_RESTORE_PENDING_LABEL,
  PAYWALL_TITLE,
} from "@/features/premium/constants";
import { isPremiumActive } from "@/features/premium/entitlement";
import { restorePurchases } from "@/lib/purchases";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";

const FEATURE_ICON_SIZE = 18;

export interface PaywallSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export const PaywallSheet = ({ visible, onDismiss }: PaywallSheetProps) => {
  const offering = usePremiumOffering(visible);
  const purchase = useMutation({
    mutationFn: purchasePremium,
    onSuccess: (info) => {
      if (info) {
        close();
      }
    },
  });
  const restore = useMutation({
    mutationFn: restorePurchases,
    onSuccess: (info) => {
      if (isPremiumActive(info)) {
        close();
      }
    },
  });

  function close() {
    purchase.reset();
    restore.reset();
    onDismiss();
  }

  const pack = offering.data ?? null;
  const isBusy = purchase.isPending || restore.isPending;
  const restoreFoundNothing = restore.isSuccess && !isPremiumActive(restore.data);

  return (
    <Sheet
      visible={visible}
      title={PAYWALL_TITLE}
      message={null}
      // Nothing dismisses mid-purchase.
      dismissible={!isBusy}
      onDismiss={close}
    >
      {offering.isPending ? (
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
});
