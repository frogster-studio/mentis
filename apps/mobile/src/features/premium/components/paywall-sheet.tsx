import { useMutation } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "@/components/ui/card";
import { QuietButton } from "@/components/ui/quiet-button";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { Sheet, useSheetBottomInset } from "@/components/ui/sheet";
import { useAuthStore } from "@/features/account/auth-store";
import { useSignInStore } from "@/features/account/sign-in-store";
import {
  awaitPremiumActivation,
  purchasePremium,
  usePremiumOffering,
} from "@/features/premium/api";
import { PaywallOffer, paywallSavings } from "@/features/premium/components/paywall-offer";
import { PremiumActivation } from "@/features/premium/components/premium-activation";
import {
  PAYWALL_ACTIVATION_CLOSE_LABEL,
  PAYWALL_ACTIVATION_PENDING,
  PAYWALL_ACTIVATION_TITLE,
  PAYWALL_OFFERING_EMPTY,
  PAYWALL_OFFERING_ERROR,
  PAYWALL_PREVIEW_PRICE,
} from "@/features/premium/constants";
import { FULL_PAYWALL, fullPaywallHeight, paywallFit } from "@/features/premium/paywall-fit";
import { usePaywallStore } from "@/features/premium/paywall-store";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

export const PaywallSheet = () => {
  const visible = usePaywallStore((state) => state.visible);
  const isPreview = usePaywallStore((state) => state.isPreview);
  const closePaywall = usePaywallStore((state) => state.close);
  const openSignIn = useSignInStore((state) => state.open);
  const isSignedOut = useAuthStore((state) => state.session === null);
  const insets = useSafeAreaInsets();
  const bottomInset = useSheetBottomInset();
  const { height, fontScale } = useWindowDimensions();
  const [fullOfferHeight, setFullOfferHeight] = useState<number | null>(null);
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

  // The sign-in sheet takes the paywall's place; a landed session brings the Player back here.
  function signInFirst() {
    close();
    openSignIn();
  }

  const pack = offering.data ?? null;
  // Nothing dismisses mid-purchase, nor while the activation is still being awaited.
  const isBusy = purchase.isPending || activation.isPending;
  // The webhook can outlast the wait: the Player leaves on a notice, never on a failure.
  const activationOutranTheWait = activation.isSuccess && !activation.data;
  const availableHeight = height - insets.top - SPACE.sm;
  const showsOffer =
    !activation.isPending &&
    !activationOutranTheWait &&
    (isPreview || (!offering.isPending && !offering.isError && pack !== null));
  const savings = paywallSavings(fontScale);
  const fit =
    fullOfferHeight === null ? FULL_PAYWALL : paywallFit(fullOfferHeight, availableHeight, savings);

  return (
    <Sheet
      visible={visible}
      isBare={true}
      title={null}
      message={null}
      dismissible={!isBusy}
      onDismiss={close}
    >
      <ScrollView
        style={{ maxHeight: availableHeight }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + GUTTER }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={fit.isScrollable}
        nestedScrollEnabled
        onContentSizeChange={(_, contentHeight) => {
          if (showsOffer) {
            setFullOfferHeight(fullPaywallHeight(contentHeight, fit, savings));
          }
        }}
      >
        {activation.isPending ? (
          <StateCard>
            <Text style={styles.stateTitle}>{PAYWALL_ACTIVATION_TITLE}</Text>
            <PremiumActivation />
          </StateCard>
        ) : activationOutranTheWait ? (
          <StateCard>
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
          </StateCard>
        ) : isPreview ? (
          // Dev only: the simulator has no store, so the offer renders without RevenueCat.
          <PaywallOffer
            priceString={PAYWALL_PREVIEW_PRICE}
            showsCrest={fit.showsCrest}
            showsIllustration={fit.showsIllustration}
            purchaseFailed={false}
            isPurchasing={false}
            isSignedOut={isSignedOut}
            onSkip={close}
            onPurchase={isSignedOut ? signInFirst : close}
          />
        ) : offering.isPending ? (
          <StateCard>
            <ScreenLoading />
          </StateCard>
        ) : offering.isError ? (
          <StateCard>
            <ScreenError message={PAYWALL_OFFERING_ERROR} onRetry={() => offering.refetch()} />
          </StateCard>
        ) : pack === null ? (
          // An offering with no package is store configuration, so retrying can only fail again.
          <StateCard>
            <ScreenError message={PAYWALL_OFFERING_EMPTY} onRetry={null} />
          </StateCard>
        ) : (
          <PaywallOffer
            priceString={pack.product.priceString}
            showsCrest={fit.showsCrest}
            showsIllustration={fit.showsIllustration}
            purchaseFailed={purchase.isError}
            isPurchasing={purchase.isPending}
            isSignedOut={isSignedOut}
            onSkip={close}
            onPurchase={isSignedOut ? signInFirst : () => purchase.mutate(pack)}
          />
        )}
      </ScrollView>
    </Sheet>
  );
};

const StateCard = ({ children }: PropsWithChildren) => (
  <Card background={null} onPress={null}>
    <View style={styles.state}>{children}</View>
  </Card>
);

const styles = StyleSheet.create({
  content: {
    paddingTop: GUTTER,
    paddingHorizontal: GUTTER,
  },
  state: {
    paddingVertical: SPACE.xl,
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
