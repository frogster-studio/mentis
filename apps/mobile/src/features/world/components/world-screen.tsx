import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useAppHeaderHeight, useCollapsedAppHeaderHeight } from "@/components/app-header";
import { useAppTabBarHeight } from "@/components/app-tab-bar";
import { useTabScroll, useTabScrollOffset } from "@/components/tab-scroll";
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
import { LeaderboardPager } from "@/features/world/components/leaderboard-pager";
import { LEADERBOARD_ERROR } from "@/features/world/constants";
import { clampPage, FIRST_PAGE } from "@/features/world/pager";
import { queryClient } from "@/lib/query-client";
import { GUTTER, SPACE } from "@/theme/tokens";

export const WorldScreen = () => {
  const router = useRouter();
  const headerHeight = useAppHeaderHeight();
  const tabBarHeight = useAppTabBarHeight();
  const owner = useAuthStore((state) => state.session?.user.id);
  const day = useCompetitionDay(owner);
  const profile = useProfile(owner);
  const standing = useStanding(owner);
  const [chosenPage, setChosenPage] = useState<number | null>(null);
  // A ranked Player opens on their own page; everyone else on the first.
  const page = chosenPage ?? standing.data?.page ?? FIRST_PAGE;
  const leaderboard = useLeaderboardPage(page);
  const onScroll = useTabScroll();
  const [pagerTop, setPagerTop] = useState<number | null>(null);
  const pagerTranslate = useStickyUnderHeader(pagerTop);
  useSeasonFreshness(owner);
  usePageInRange(page, leaderboard.data?.pageCount, setChosenPage);

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
          <>
            <Animated.View
              onLayout={(event) => setPagerTop(event.nativeEvent.layout.y)}
              style={[
                styles.pager,
                pagerTranslate === null ? null : { transform: [{ translateY: pagerTranslate }] },
              ]}
            >
              <LeaderboardPager
                page={page}
                pageCount={leaderboard.data.pageCount}
                myPage={standing.data?.page ?? null}
                onPage={setChosenPage}
              />
            </Animated.View>
            <LeaderboardList
              entries={leaderboard.data.entries}
              myPseudo={profile.data?.pseudo ?? null}
            />
          </>
        )}
      </Animated.ScrollView>
    </ScreenContainer>
  );
};

// The ScrollView's own sticky rows come to rest at the very top, which the header card covers.
function useStickyUnderHeader(top: number | null) {
  const scrollOffset = useTabScrollOffset();
  const collapsedHeaderHeight = useCollapsedAppHeaderHeight();

  if (top === null) {
    return null;
  }
  const rest = top - collapsedHeaderHeight;
  return scrollOffset.interpolate({
    inputRange: [rest, rest + 1],
    outputRange: [0, 1],
    extrapolateLeft: "clamp",
  });
}

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

// The Season can shrink under the Standing's page, so a page past the end falls back onto the last.
function usePageInRange(
  page: number,
  pageCount: number | undefined,
  onPage: (page: number) => void,
) {
  useEffect(() => {
    if (pageCount !== undefined && clampPage(page, pageCount) !== page) {
      onPage(clampPage(page, pageCount));
    }
  }, [page, pageCount, onPage]);
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: SPACE.lg, paddingHorizontal: GUTTER },
  cards: { gap: SPACE.lg },
  // Held over the rows it stays above as they scroll past it.
  pager: { zIndex: 1 },
});
