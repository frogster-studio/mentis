import { useRouter } from "expo-router";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useMainHeaderHeight } from "@/components/main-header";
import { MAIN_SUB_HEADER_VISIBLE_HEIGHT } from "@/components/main-sub-header";
import { useTabScroll } from "@/components/tab-scroll";
import { iconNameOrFallback } from "@/components/ui/icon-name";
import { showToast } from "@/components/ui/toast";
import { useProfile } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { useSignInStore } from "@/features/account/sign-in-store";
import { useCompetitionDay, useStanding, useTranscript } from "@/features/competition/api";
import { bestAttempt } from "@/features/competition/best-attempt";
import { CompetitionCard } from "@/features/competition/components/competition-card";
import { YesterdayCompetitionCard } from "@/features/competition/components/yesterday-competition-card";
import {
  COMPETITION_DAILY_TEASER,
  COMPETITION_DAILY_TITLE,
  COMPETITION_DONE_TITLE,
  COMPETITION_SEE_RESULTS_LABEL,
  COMPETITION_SIGN_IN_REQUIRED,
  COMPETITION_SIGN_IN_TOAST_DELAY_MS,
  COMPETITION_START_LABEL,
  COMPETITION_TRY_AGAIN_LABEL,
} from "@/features/competition/constants";
import { useCompetitionStreak } from "@/features/competition/use-competition-streak";
import { usePremiumGate } from "@/features/premium/use-premium-gate";
import { LeaderboardPreviewCard } from "@/features/world/components/leaderboard-preview-card";
import { previewPage } from "@/features/world/leaderboard-preview";
import { useLeaderboardPreview } from "@/features/world/use-leaderboard-preview";
import { useLoadFailureToast } from "@/features/world/use-load-failure-toast";
import { useSeasonFreshness } from "@/features/world/use-season-freshness";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

export default function Page() {
  const router = useRouter();
  const headerHeight = useMainHeaderHeight() + MAIN_SUB_HEADER_VISIBLE_HEIGHT;
  const owner = useAuthStore((state) => state.session?.user.id);
  const isSignedIn = owner !== undefined;
  const openSignIn = useSignInStore((state) => state.open);
  const day = useCompetitionDay(owner);
  const profile = useProfile(owner);
  const standing = useStanding(owner);
  const competitionStreak = useCompetitionStreak(owner);
  const myPseudo = profile.data?.pseudo ?? null;
  const preview = useLeaderboardPreview(previewPage(owner, standing), myPseudo);
  const gatePremium = usePremiumGate();
  const best = day.data ? bestAttempt(day.data.attempts) : undefined;
  const offersReplay = best !== undefined && day.data?.replay === true;
  const transcript = useTranscript(owner, best?.id, best !== undefined);
  const isDayUnknown = isSignedIn && day.data === undefined;
  const isDayFrozen = isDayUnknown && day.isError;
  const isTranscriptFrozen = transcript.data === undefined && transcript.isError;
  const isStandingFrozen = standing.data === undefined && standing.isError;
  useSeasonFreshness(owner);
  useLoadFailureToast([isDayFrozen, isTranscriptFrozen, isStandingFrozen, preview.isFrozen]);
  const { height } = useWindowDimensions();
  const onScroll = useTabScroll();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={[
        styles.content,
        { paddingTop: headerHeight + SPACE.lg, paddingBottom: height / 3 },
      ]}
    >
      <LeaderboardPreviewCard
        entries={preview.entries}
        myPseudo={myPseudo}
        isFrozen={preview.isFrozen}
        onPress={() => {
          if (!preview.isFrozen) {
            router.push("/leaderboard");
            return;
          }
          preview.refetch();
          // The preview fell back to page 1 without it, so a retry also re-asks the Player's page.
          if (isStandingFrozen) void standing.refetch();
        }}
      />
      <View style={styles.cards}>
        <CompetitionCard
          title={best ? COMPETITION_DONE_TITLE : COMPETITION_DAILY_TITLE}
          teaser={best ? null : COMPETITION_DAILY_TEASER}
          score={best?.score ?? null}
          colors={best ? ["#83D3AF"] : [COLORS.primaryGlow, COLORS.primary]}
          streak={competitionStreak}
          showPremium={offersReplay}
          actionLabel={
            best
              ? offersReplay
                ? COMPETITION_TRY_AGAIN_LABEL
                : COMPETITION_SEE_RESULTS_LABEL
              : COMPETITION_START_LABEL
          }
          isStateKnown={!isDayUnknown}
          theme={
            transcript.data
              ? {
                  image: { uri: transcript.data.imageUrl },
                  categoryIcon: iconNameOrFallback(transcript.data.category.icon),
                }
              : null
          }
          isFrozen={isDayFrozen || isTranscriptFrozen}
          onPress={() => {
            if (!isSignedIn) {
              openSignIn();
              // The sheet lands first, then the toast explains why it opened.
              setTimeout(
                () => showToast(COMPETITION_SIGN_IN_REQUIRED, "account-lock-outline", "top-center"),
                COMPETITION_SIGN_IN_TOAST_DELAY_MS,
              );
              return;
            }
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
          onRetry={() => {
            if (isDayFrozen) void day.refetch();
            if (isTranscriptFrozen) void transcript.refetch();
          }}
        />

        {day.data?.catchup ? (
          <YesterdayCompetitionCard
            onPress={() =>
              gatePremium(() =>
                router.push({ pathname: "/competition", params: { kind: "catchup" } }),
              )
            }
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: SPACE.xl, paddingHorizontal: GUTTER },
  cards: { gap: SPACE.xl },
});
