import { StyleSheet, Text, View } from "react-native";
import { useAppHeaderHeight } from "@/components/app-header";
import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { useAuthStore } from "@/features/account/auth-store";
import { CompetitionCard } from "@/features/competition/components/competition-card";
import { WORLD_PLACEHOLDER } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

export function WorldScreen() {
  const headerHeight = useAppHeaderHeight();
  const session = useAuthStore((state) => state.session);

  return (
    <ScreenContainer edges={TAB_SCREEN_EDGES}>
      <View style={[styles.content, { paddingTop: headerHeight }]}>
        {/* Competition needs an Account, so the entry simply is not there for a signed-out Player. */}
        {session ? <CompetitionCard /> : null}
        <View style={styles.placeholder}>
          <Text style={styles.copy}>{WORLD_PLACEHOLDER}</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: SPACE.lg,
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
});
