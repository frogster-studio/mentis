import { StyleSheet, Text, View } from "react-native";
import { useAppHeaderHeight } from "@/components/app-header";
import { useAppTabBarHeight } from "@/components/app-tab-bar";
import { ScreenTitleCard } from "@/components/screen-title-card";
import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { useAuthStore } from "@/features/account/auth-store";
import { CompetitionCard } from "@/features/competition/components/competition-card";
import { WORLD_PLACEHOLDER, WORLD_TITLE } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

export function WorldScreen() {
  const headerHeight = useAppHeaderHeight();
  const tabBarHeight = useAppTabBarHeight();
  const session = useAuthStore((state) => state.session);

  return (
    <ScreenContainer edges={TAB_SCREEN_EDGES}>
      <View style={[styles.content, { paddingTop: headerHeight, paddingBottom: tabBarHeight }]}>
        {/* No gap above: the title card is the bottom half of the header's card. */}
        <ScreenTitleCard title={WORLD_TITLE} />
        <View style={styles.block}>
          {/* Competition needs an Account, so the entry simply is not there for a signed-out Player. */}
          {session ? <CompetitionCard /> : null}
          <View style={styles.placeholder}>
            <Text style={styles.copy}>{WORLD_PLACEHOLDER}</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  block: {
    flex: 1,
    gap: SPACE.lg,
    paddingTop: SPACE.md,
    paddingHorizontal: GUTTER,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    ...TEXT.body,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
  boxWithShadow: {
    marginTop: 100,
    marginHorizontal: "auto",
    width: "70%",
    aspectRatio: 3 / 5,
    borderRadius: 24,
    backgroundColor: "red",
    shadowColor: "#196709",
    shadowOffset: {
      width: 10,
      height: 10,
    },
    shadowOpacity: 0.75,
    shadowRadius: 25,
    elevation: 15,
  },
});
