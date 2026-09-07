import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useAppHeaderHeight } from "@/components/app-header";
import { useAppTabBarHeight } from "@/components/app-tab-bar";
import { useTabScroll } from "@/components/tab-scroll";
import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { useAuthStore } from "@/features/account/auth-store";
import { useCompetitionDay } from "@/features/competition/api";
import { CompetitionCard } from "@/features/competition/components/competition-card";
import {
  CATCHUP_TEASER,
  CATCHUP_TITLE,
  COMPETITION_TEASER,
  COMPETITION_TITLE,
} from "@/features/competition/constants";
import { GUTTER, SPACE } from "@/theme/tokens";

export const WorldScreen = () => {
  const router = useRouter();
  const headerHeight = useAppHeaderHeight();
  const tabBarHeight = useAppTabBarHeight();
  const owner = useAuthStore((state) => state.session?.user.id);
  const day = useCompetitionDay(owner);
  // The Monde tab never scrolls, so focusing it opens the header's title back up.
  useTabScroll();

  return (
    <ScreenContainer edges={TAB_SCREEN_EDGES} underlay={null}>
      <View style={[styles.content, { paddingTop: headerHeight, paddingBottom: tabBarHeight }]}>
        <View style={styles.block}>
          {/* Competition needs an Account, so the entries simply are not there for a signed-out Player. */}
          {owner !== undefined ? (
            <>
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
            </>
          ) : null}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1 },
  block: { flex: 1, gap: SPACE.lg, paddingTop: SPACE.md, paddingHorizontal: GUTTER },
});
