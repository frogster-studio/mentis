import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useAppHeaderHeight } from "@/components/app-header";
import { useAppTabBarHeight } from "@/components/app-tab-bar";
import { useTabScroll } from "@/components/tab-scroll";
import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { useProfile } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { competitionKeys, useCompetitionDay, useStanding } from "@/features/competition/api";
import { CompetitionCard } from "@/features/competition/components/competition-card";
import {
  CATCHUP_TEASER,
  CATCHUP_TITLE,
  COMPETITION_TEASER,
  COMPETITION_TITLE,
} from "@/features/competition/constants";
import { useLeaderboardPage, worldKeys } from "@/features/world/api";
import { LeaderboardList } from "@/features/world/components/leaderboard-list";
import { LEADERBOARD_ERROR } from "@/features/world/constants";
import { queryClient } from "@/lib/query-client";
import { GUTTER, SPACE } from "@/theme/tokens";

const FIRST_PAGE = 1;

export const WorldScreen = () => {
  const router = useRouter();
  const headerHeight = useAppHeaderHeight();
  const tabBarHeight = useAppTabBarHeight();
  const owner = useAuthStore((state) => state.session?.user.id);
  const day = useCompetitionDay(owner);
  const profile = useProfile(owner);
  const standing = useStanding(owner);
  // A ranked Player opens on their own page; everyone else on the first.
  const leaderboard = useLeaderboardPage(standing.data?.page ?? FIRST_PAGE);
  const onScroll = useTabScroll();
  useSeasonFreshness(owner);

  return (
    <ScreenContainer edges={TAB_SCREEN_EDGES} underlay={null}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + SPACE.md, paddingBottom: tabBarHeight },
        ]}
      >
        {/* Competition needs an Account, so the entries simply are not there for a signed-out Player. */}
        {owner !== undefined ? (
          <View style={styles.cards}>
            <CompetitionCard
              title={COMPETITION_TITLE}
              teaser={COMPETITION_TEASER}
              icon="emoji-events"
              onPress={() => router.push("/competition")}
            />
            {/* Offered while the API says yesterday is empty — Premium is asked at issuance. */}
            {day.data?.catchup ? (
              <CompetitionCard
                title={CATCHUP_TITLE}
                teaser={CATCHUP_TEASER}
                icon="history"
                onPress={() =>
                  router.push({ pathname: "/competition", params: { kind: "catchup" } })
                }
              />
            ) : null}
          </View>
        ) : null}

        {leaderboard.isPending ? (
          <ScreenLoading />
        ) : leaderboard.isError ? (
          <ScreenError message={LEADERBOARD_ERROR} onRetry={() => void leaderboard.refetch()} />
        ) : (
          <LeaderboardList
            entries={leaderboard.data.entries}
            myPseudo={profile.data?.pseudo ?? null}
          />
        )}
      </Animated.ScrollView>
    </ScreenContainer>
  );
};

// Another Account finalizing moves every rank, so coming back to the tab re-reads the Season.
function useSeasonFreshness(owner: string | undefined) {
  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: worldKeys.leaderboard });
      if (owner !== undefined) {
        void queryClient.invalidateQueries({ queryKey: competitionKeys.standing(owner) });
      }
    }, [owner]),
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: SPACE.lg, paddingHorizontal: GUTTER },
  cards: { gap: SPACE.lg },
});
