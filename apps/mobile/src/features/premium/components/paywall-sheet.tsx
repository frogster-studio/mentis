import { useMutation } from "@tanstack/react-query";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuietButton } from "@/components/ui/quiet-button";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { Sheet, useSheetBottomInset } from "@/components/ui/sheet";
import {
  awaitPremiumActivation,
  purchasePremium,
  usePremiumOffering,
} from "@/features/premium/api";
import { PaywallOffer } from "@/features/premium/components/paywall-offer";
import { PremiumActivation } from "@/features/premium/components/premium-activation";
import {
  PAYWALL_ACTIVATION_CLOSE_LABEL,
  PAYWALL_ACTIVATION_PENDING,
  PAYWALL_ACTIVATION_TITLE,
  PAYWALL_OFFERING_EMPTY,
  PAYWALL_OFFERING_ERROR,
  PAYWALL_PREVIEW_PRICE,
} from "@/features/premium/constants";
import { usePaywallStore } from "@/features/premium/paywall-store";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

export const PaywallSheet = () => {
  const visible = usePaywallStore((state) => state.visible);
  const isPreview = usePaywallStore((state) => state.isPreview);
  const closePaywall = usePaywallStore((state) => state.close);
  const insets = useSafeAreaInsets();
  const bottomInset = useSheetBottomInset();
  const { height } = useWindowDimensions();
  const offering = usePremiumOffering(visible && !isPreview);
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

  function close() {
    purchase.reset();
    activation.reset();
    closePaywall();
  }

  const pack = offering.data ?? null;
  // Nothing dismisses mid-purchase, nor while the activation is still being awaited.
  const isBusy = purchase.isPending || activation.isPending;
  const sheetHeight = height - insets.top - SPACE.sm;

  function renderState() {
    if (activation.isPending) {
      return (
        <>
          <Text style={styles.stateTitle}>{PAYWALL_ACTIVATION_TITLE}</Text>
          <PremiumActivation />
        </>
      );
    }
    // The webhook can outlast the wait: the Player leaves on a notice, never on a failure.
    if (activation.isSuccess && !activation.data) {
      return (
        <>
          <Text style={styles.stateTitle}>{PAYWALL_ACTIVATION_TITLE}</Text>
          <Text style={styles.notice}>{PAYWALL_ACTIVATION_PENDING}</Text>
          <QuietButton
            layout="block"
            label={PAYWALL_ACTIVATION_CLOSE_LABEL}
            icon={null}
            accessibilityLabel={null}
            disabled={false}
            onPress={close}
          />
        </>
      );
    }
    if (isPreview) return null;
    if (offering.isPending) return <ScreenLoading />;
    if (offering.isError) {
      return <ScreenError message={PAYWALL_OFFERING_ERROR} onRetry={() => offering.refetch()} />;
    }
    // An offering with no package is store configuration, so retrying can only fail again.
    if (pack === null) return <ScreenError message={PAYWALL_OFFERING_EMPTY} onRetry={null} />;
    return null;
  }

  const state = renderState();

  return (
    <Sheet
      visible={visible}
      isBare={true}
      title={null}
      message={null}
      dismissible={!isBusy}
      onDismiss={close}
    >
      <FastSquircleView
        style={[styles.sheet, { height: sheetHeight, paddingBottom: bottomInset + GUTTER }]}
      >
        {state ? (
          <View style={styles.state}>{state}</View>
        ) : (
          // Only the dev preview gets here without a pack: the simulator has no store.
          <PaywallOffer
            priceString={pack?.product.priceString ?? PAYWALL_PREVIEW_PRICE}
            purchaseFailed={purchase.isError}
            isPurchasing={purchase.isPending}
            onSkip={close}
            onPurchase={() => (pack ? purchase.mutate(pack) : close())}
          />
        )}
      </FastSquircleView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  sheet: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.background,
    paddingTop: GUTTER,
    paddingHorizontal: GUTTER,
  },
  state: {
    flex: 1,
    justifyContent: "center",
    gap: SPACE.lg,
  },
  stateTitle: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
    textAlign: "center",
  },
  notice: {
    ...TEXT.body,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
});
