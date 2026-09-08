import { useMutation } from "@tanstack/react-query";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaperBackground } from "@/components/ui/paper-background";
import { QuietButton } from "@/components/ui/quiet-button";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { Squircle } from "@/components/ui/squircle";
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
} from "@/features/premium/constants";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

// The scrim leaves the screen underneath legible, so the paywall reads as a layer over it.
const PANEL_MAX_HEIGHT = "94%";

export interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const PaywallModal = ({ visible, onDismiss }: PaywallModalProps) => {
  const insets = useSafeAreaInsets();
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

  function close() {
    purchase.reset();
    activation.reset();
    onDismiss();
  }

  const pack = offering.data ?? null;
  // Nothing dismisses mid-purchase, nor while the activation is still being awaited.
  const isBusy = purchase.isPending || activation.isPending;
  // The webhook can outlast the wait: the Player leaves on a notice, never on a failure.
  const activationOutranTheWait = activation.isSuccess && !activation.data;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} disabled={isBusy} onPress={close} />
        <Squircle
          radius={RADIUS.xl}
          corners="top"
          color={COLORS.background}
          borderColor={null}
          borderWidth={null}
          style={styles.panel}
        >
          <PaperBackground />
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.lg }]}
            showsVerticalScrollIndicator={false}
          >
            {activation.isPending ? (
              <View style={styles.state}>
                <Text style={styles.stateTitle}>{PAYWALL_ACTIVATION_TITLE}</Text>
                <PremiumActivation />
              </View>
            ) : activationOutranTheWait ? (
              <View style={styles.state}>
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
              </View>
            ) : offering.isPending ? (
              <View style={styles.state}>
                <ScreenLoading />
              </View>
            ) : offering.isError ? (
              <View style={styles.state}>
                <ScreenError message={PAYWALL_OFFERING_ERROR} onRetry={() => offering.refetch()} />
              </View>
            ) : pack === null ? (
              // An offering with no package is store configuration, so retrying can only fail again.
              <View style={styles.state}>
                <ScreenError message={PAYWALL_OFFERING_EMPTY} onRetry={null} />
              </View>
            ) : (
              <PaywallOffer
                pack={pack}
                purchaseFailed={purchase.isError}
                isPurchasing={purchase.isPending}
                onSkip={close}
                onPurchase={() => purchase.mutate(pack)}
              />
            )}
          </ScrollView>
        </Squircle>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: COLORS.scrim,
  },
  panel: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    maxHeight: PANEL_MAX_HEIGHT,
  },
  content: {
    paddingTop: GUTTER,
    paddingHorizontal: GUTTER,
  },
  state: {
    paddingVertical: SPACE.xxl,
    paddingHorizontal: SPACE.lg,
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
