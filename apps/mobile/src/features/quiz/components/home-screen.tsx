import { ScrollView, StyleSheet } from "react-native";
import { useAppHeaderHeight } from "@/components/app-header";
import { useAppTabBarHeight } from "@/components/app-tab-bar";
import { ScreenTitleCard } from "@/components/screen-title-card";
import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { PracticeCard } from "@/features/quiz/components/practice-card";
import { HOME_TITLE } from "@/features/quiz/constants";
import { SPACE } from "@/theme/tokens";

export function HomeScreen() {
  const headerHeight = useAppHeaderHeight();
  const tabBarHeight = useAppTabBarHeight();

  return (
    <ScreenContainer edges={TAB_SCREEN_EDGES}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight, paddingBottom: tabBarHeight },
        ]}
      >
        {/* No gap above: the title card is the bottom half of the header's card. */}
        <ScreenTitleCard title={HOME_TITLE} />
        <PracticeCard />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: SPACE.md,
  },
});
