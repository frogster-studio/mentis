import { useRouter } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { useBottomTabBarHeight } from "@/components/bottom-tab-bar";
import { QuietButton } from "@/components/ui/quiet-button";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { useAuthStore } from "@/features/account/auth-store";
import { AccountActions } from "@/features/account/components/account-actions";
import { LegalLinks } from "@/features/account/components/legal-links";
import { PAYWALL_PREVIEW_LABEL, REPLAY_ONBOARDING_LABEL } from "@/features/account/constants";
import { useOnboardingStore } from "@/features/onboarding/store";
import { usePaywallStore } from "@/features/premium/paywall-store";
import { useIsPremium } from "@/features/premium/use-is-premium";
import { GUTTER, SPACE } from "@/theme/tokens";

export const ProfileInfosScreen = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const user = useAuthStore((state) => state.session?.user);
  const isPremium = useIsPremium();
  const openPaywallPreview = usePaywallStore((state) => state.openPreview);
  const replayOnboarding = useOnboardingStore((state) => state.replay);
  const router = useRouter();

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + SPACE.lg }]}
    >
      <LegalLinks />
      {user ? <AccountActions user={user} isPremium={isPremium} /> : null}
      {__DEV__ ? (
        <>
          <QuietButton
            layout="block"
            label={REPLAY_ONBOARDING_LABEL}
            icon={null}
            accessibilityLabel={null}
            disabled={false}
            onPress={() => {
              replayOnboarding();
              router.dismissTo("/");
            }}
          />
          <QuietButton
            layout="block"
            label={PAYWALL_PREVIEW_LABEL}
            icon={null}
            accessibilityLabel={null}
            disabled={false}
            onPress={openPaywallPreview}
          />
        </>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // The scene is clear over the layout's paper and wash, so the page caps its own width.
  scroll: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
  content: {
    paddingTop: SPACE.lg,
    paddingHorizontal: GUTTER,
    gap: SPACE.md,
  },
});
