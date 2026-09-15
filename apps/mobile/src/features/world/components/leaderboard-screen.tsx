import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { QuietButton } from "@/components/ui/quiet-button";
import { ALL_SCREEN_EDGES, ScreenContainer } from "@/components/ui/screen-container";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { useProfile } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { useStanding } from "@/features/competition/api";
import { useLeaderboardPage } from "@/features/world/api";
import { LeaderboardList } from "@/features/world/components/leaderboard-list";
import { LeaderboardPager } from "@/features/world/components/leaderboard-pager";
import {
  LEADERBOARD_BACK_LABEL,
  LEADERBOARD_ERROR,
  LEADERBOARD_TITLE,
} from "@/features/world/constants";
import { clampPage, FIRST_PAGE } from "@/features/world/pager";
import { useSeasonFreshness } from "@/features/world/use-season-freshness";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, GUTTER, SPACE } from "@/theme/tokens";

export const LeaderboardScreen = () => {
  const router = useRouter();
  const owner = useAuthStore((state) => state.session?.user.id);
  const profile = useProfile(owner);
  const standing = useStanding(owner);
  const [chosenPage, setChosenPage] = useState<number | null>(null);
  const page = chosenPage ?? standing.data?.page ?? FIRST_PAGE;
  const leaderboard = useLeaderboardPage(page);
  const scroll = useRef<ScrollView>(null);
  const pageCount = leaderboard.data?.pageCount;
  useSeasonFreshness(owner);

  useEffect(() => {
    if (
      !leaderboard.isPlaceholderData &&
      pageCount !== undefined &&
      clampPage(page, pageCount) !== page
    ) {
      setChosenPage(clampPage(page, pageCount));
    }
  }, [page, pageCount, leaderboard.isPlaceholderData]);

  return (
    <ScreenContainer edges={ALL_SCREEN_EDGES} underlay={null}>
      <View style={styles.header}>
        <QuietButton
          layout="circle"
          label={null}
          icon="chevron-left"
          accessibilityLabel={LEADERBOARD_BACK_LABEL}
          disabled={false}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/world"))}
        />
        <Text style={styles.title}>{LEADERBOARD_TITLE}</Text>
        <View style={styles.spacer} />
      </View>
      {leaderboard.isPending ? (
        <ScreenLoading />
      ) : leaderboard.isError ? (
        <ScreenError message={LEADERBOARD_ERROR} onRetry={() => void leaderboard.refetch()} />
      ) : (
        <View style={styles.body}>
          <LeaderboardPager
            page={page}
            pageCount={leaderboard.data.pageCount}
            myPage={standing.data?.page ?? null}
            onPage={(nextPage) => {
              setChosenPage(nextPage);
              scroll.current?.scrollTo({ y: 0, animated: false });
            }}
          />
          <ScrollView
            ref={scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.rows}
          >
            <LeaderboardList
              entries={leaderboard.data.entries}
              myPseudo={profile.data?.pseudo ?? null}
            />
          </ScrollView>
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: GUTTER,
    paddingVertical: SPACE.md,
  },
  title: { ...TEXT.screenTitle, flex: 1, color: COLORS.ink, textAlign: "center" },
  spacer: { width: CONTROL_HEIGHT },
  body: { flex: 1, paddingHorizontal: GUTTER, gap: SPACE.md },
  rows: { paddingBottom: SPACE.lg },
});
