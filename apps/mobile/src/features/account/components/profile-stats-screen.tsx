import { ScrollView, StyleSheet, Text } from "react-native";
import { useAppTabBarHeight } from "@/components/app-tab-bar";
import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { useAuthStore } from "@/features/account/auth-store";
import { ProfileWash } from "@/features/account/components/profile-wash";
import { TransferNotice } from "@/features/account/components/transfer-notice";
import { PROFILE_STATS_EMPTY } from "@/features/account/constants";
import { PremiumBanner } from "@/features/premium/components/premium-banner";
import { usePaywallStore } from "@/features/premium/paywall-store";
import { useIsPremium } from "@/features/premium/use-is-premium";
import { HomeThemeCard } from "@/features/quiz/components/home-theme-card";
import { useTransferStore } from "@/features/quiz/transfer-store";
import { useHomeCards } from "@/features/quiz/use-home-cards";
import { PURCHASES_SUPPORTED } from "@/lib/purchases";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

export const ProfileStatsScreen = () => {
  const tabBarHeight = useAppTabBarHeight();
  const user = useAuthStore((state) => state.session?.user);
  const isPremium = useIsPremium();
  const openPaywall = usePaywallStore((state) => state.open);
  const cards = useHomeCards();
  const transferred = useTransferStore((state) => state.transferred);
  const dismissed = useTransferStore((state) => state.dismissed);
  const isEmpty = cards.length === 0;

  // The signed-out shelf is empty because the stats moved, not because nothing was ever played.
  const showTransferNotice = !user && transferred && isEmpty && !dismissed;

  return (
    <ScreenContainer edges={TAB_SCREEN_EDGES} underlay={<ProfileWash />}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + SPACE.lg }]}
      >
        {user && PURCHASES_SUPPORTED && isPremium !== null ? (
          <PremiumBanner isPremium={isPremium} onPress={openPaywall} />
        ) : null}
        {showTransferNotice ? <TransferNotice /> : null}
        {isEmpty ? (
          <Text style={styles.empty}>{PROFILE_STATS_EMPTY}</Text>
        ) : (
          cards.map((card) => (
            <HomeThemeCard
              key={card.id}
              name={card.name}
              average={card.average}
              sessionCount={card.sessionCount}
              category={card.category ?? null}
            />
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: SPACE.lg,
    paddingHorizontal: GUTTER,
    gap: SPACE.md,
  },
  empty: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
    textAlign: "center",
    paddingVertical: SPACE.lg,
  },
});
