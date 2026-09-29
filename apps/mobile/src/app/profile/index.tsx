import { ScrollView, StyleSheet, Text } from "react-native";
import { StatTilesGrid } from "@/components/account/stat-tiles-grid";
import { ThemeStatsTable } from "@/components/account/theme-stats-table";
import { useBottomTabBarHeight } from "@/components/bottom-tab-bar";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { useAccountStats } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { TransferNotice } from "@/features/account/components/transfer-notice";
import { PROFILE_STATS_EMPTY, PROFILE_STATS_ERROR } from "@/features/account/constants";
import { useStanding } from "@/features/competition/api";
import { PremiumBanner } from "@/features/premium/components/premium-banner";
import { usePaywallStore } from "@/features/premium/paywall-store";
import { useIsPremium } from "@/features/premium/use-is-premium";
import { categoryGroups, statTiles } from "@/features/quiz/theme-tallies";
import { useTransferStore } from "@/features/quiz/transfer-store";
import { usePracticeStreakRecord } from "@/features/quiz/use-practice-streak";
import { useThemeTallies } from "@/features/quiz/use-theme-tallies";
import { PURCHASES_SUPPORTED } from "@/lib/purchases";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

export default function Page() {
  const tabBarHeight = useBottomTabBarHeight();
  const owner = useAuthStore((state) => state.session?.user.id);
  const isSignedIn = owner !== undefined;
  const isPremium = useIsPremium();
  const openPaywall = usePaywallStore((state) => state.open);
  const accountStats = useAccountStats(owner);
  const standing = useStanding(owner);
  const practiceStreak = usePracticeStreakRecord();
  const tallies = useThemeTallies();
  const transferred = useTransferStore((state) => state.transferred);
  const dismissed = useTransferStore((state) => state.dismissed);

  const groups = categoryGroups(tallies);
  const longestCompetitionStreak = isSignedIn
    ? (accountStats.data?.competitionStreak.longest ?? 0)
    : null;
  // A failed Standing read shows « -- », never the rank it last cached.
  const rank = standing.isSuccess ? standing.data.rank : null;

  // The signed-out world is empty because the stats moved, not because nothing was ever played.
  const showTransferNotice = !isSignedIn && transferred && tallies.length === 0 && !dismissed;

  const isLoading = isSignedIn && accountStats.isPending;
  const isFailed = isSignedIn && !isLoading && accountStats.data === undefined;

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + SPACE.lg }]}
    >
      {isSignedIn && PURCHASES_SUPPORTED && isPremium !== null ? (
        <PremiumBanner isPremium={isPremium} onPress={openPaywall} />
      ) : null}
      {showTransferNotice ? <TransferNotice /> : null}
      {isLoading ? (
        <ScreenLoading />
      ) : isFailed ? (
        <ScreenError message={PROFILE_STATS_ERROR} onRetry={() => void accountStats.refetch()} />
      ) : (
        <>
          <StatTilesGrid
            tiles={statTiles(tallies, isSignedIn)}
            longestPracticeStreak={practiceStreak?.longest ?? 0}
            longestCompetitionStreak={longestCompetitionStreak}
            rank={rank}
            isSignedOut={!isSignedIn}
          />
          {groups.length === 0 ? (
            <Text style={styles.empty}>{PROFILE_STATS_EMPTY}</Text>
          ) : (
            <ThemeStatsTable groups={groups} />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // The scene is clear over the layout's paper and wash, so the page caps its own width.
  scroll: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
  // Grows to the viewport, so a loading or failed read fills the space under the banners.
  content: {
    flexGrow: 1,
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
