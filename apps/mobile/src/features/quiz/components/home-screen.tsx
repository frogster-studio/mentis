import { Animated } from "react-native";
import { useAppHeaderHeight } from "@/components/app-header";
import { useAppTabBarHeight } from "@/components/app-tab-bar";
import { useTabScroll } from "@/components/tab-scroll";
import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { PracticeCard } from "@/features/quiz/components/practice-card";
import { SPACE } from "@/theme/tokens";

export function HomeScreen() {
  const headerHeight = useAppHeaderHeight();
  const tabBarHeight = useAppTabBarHeight();
  const onScroll = useTabScroll();

  return (
    <ScreenContainer edges={TAB_SCREEN_EDGES}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: headerHeight + SPACE.md,
          paddingBottom: tabBarHeight,
        }}
      >
        <PracticeCard />
      </Animated.ScrollView>
    </ScreenContainer>
  );
}
