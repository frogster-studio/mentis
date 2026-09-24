import { useRouter } from "expo-router";
import { Animated, StyleSheet, View } from "react-native";
import { useAppHeaderHeight } from "@/components/app-header";
import { useAppTabBarHeight } from "@/components/app-tab-bar";
import { useTabScroll } from "@/components/tab-scroll";
import { iconNameOrFallback } from "@/components/ui/icon-name";
import { PaperBackground } from "@/components/ui/paper-background";
import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { useProfile } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { useCompetitionDay, useStanding, useTranscript } from "@/features/competition/api";
import { bestAttempt } from "@/features/competition/best-attempt";
import { CompetitionCard } from "@/features/competition/components/competition-card";
import { YesterdayCompetitionCard } from "@/features/competition/components/yesterday-competition-card";
import {
  COMPETITION_DAILY_TEASER,
  COMPETITION_DAILY_TITLE,
  COMPETITION_DONE_TITLE,
  COMPETITION_ERROR,
  COMPETITION_SEE_RESULTS_LABEL,
  COMPETITION_START_LABEL,
  COMPETITION_TRY_AGAIN_LABEL,
} from "@/features/competition/constants";
import { usePremiumGate } from "@/features/premium/use-premium-gate";
import { LeaderboardPreviewCard } from "@/features/world/components/leaderboard-preview-card";
import { LEADERBOARD_ERROR } from "@/features/world/constants";
import { previewPage } from "@/features/world/leaderboard-preview";
import { useLeaderboardPreview } from "@/features/world/use-leaderboard-preview";
import { useSeasonFreshness } from "@/features/world/use-season-freshness";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

export const WorldScreen = () => {
  const router = useRouter();
  const headerHeight = useAppHeaderHeight("/world");
  const tabBarHeight = useAppTabBarHeight();
  const owner = useAuthStore((state) => state.session?.user.id);
  const day = useCompetitionDay(owner);
  const profile = useProfile(owner);
  const standing = useStanding(owner);
  const myPseudo = profile.data?.pseudo ?? null;
  const preview = useLeaderboardPreview(previewPage(owner, standing), myPseudo);
  const onScroll = useTabScroll();
  const gatePremium = usePremiumGate();
  const best = day.data ? bestAttempt(day.data.attempts) : undefined;
  const offersReplay = best !== undefined && day.data?.replay === true;
  const transcript = useTranscript(owner, best?.id, best !== undefined);
  useSeasonFreshness(owner);

  return (
    <ScreenContainer edges={TAB_SCREEN_EDGES} underlay={<PaperBackground isDark={true} />}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + SPACE.xl, paddingBottom: tabBarHeight + SPACE.lg },
        ]}
      >
        {preview.isPending ? (
          <ScreenLoading />
        ) : preview.isError ? (
          <ScreenError message={LEADERBOARD_ERROR} onRetry={preview.refetch} />
        ) : (
          <LeaderboardPreviewCard
            entries={preview.entries}
            myPseudo={myPseudo}
            onPress={() => router.push("/leaderboard")}
          />
        )}
        {owner !== undefined ? (
          day.isPending ? (
            <ScreenLoading />
          ) : day.isError ? (
            <ScreenError message={COMPETITION_ERROR} onRetry={() => void day.refetch()} />
          ) : (
            <View style={styles.cards}>
              <CompetitionCard
                title={best ? COMPETITION_DONE_TITLE : COMPETITION_DAILY_TITLE}
                teaser={best ? null : COMPETITION_DAILY_TEASER}
                score={best?.score ?? null}
                colors={best ? ["#83D3AF"] : [COLORS.primaryGlow, COLORS.primary]}
                showStreak={true}
                showPremium={offersReplay}
                themeImage={transcript.data ? { uri: transcript.data.imageUrl } : undefined}
                categoryIcon={
                  transcript.data ? iconNameOrFallback(transcript.data.category.icon) : undefined
                }
                actionLabel={
                  best
                    ? offersReplay
                      ? COMPETITION_TRY_AGAIN_LABEL
                      : COMPETITION_SEE_RESULTS_LABEL
                    : COMPETITION_START_LABEL
                }
                onPress={() => {
                  if (offersReplay) {
                    gatePremium(() =>
                      router.push({ pathname: "/competition", params: { kind: "replay" } }),
                    );
                    return;
                  }
                  router.push({
                    pathname: "/competition",
                    params: { kind: best?.kind ?? "initial" },
                  });
                }}
              />

              {day.data.catchup ? (
                <YesterdayCompetitionCard
                  onPress={() =>
                    gatePremium(() =>
                      router.push({ pathname: "/competition", params: { kind: "catchup" } }),
                    )
                  }
                  onExpire={day.refetch}
                />
              ) : null}
            </View>
          )
        ) : null}
      </Animated.ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: SPACE.xl, paddingHorizontal: GUTTER },
  cards: { gap: SPACE.xl },
});
