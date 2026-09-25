import { ScrollView } from "react-native-gesture-handler";
import { useMainHeaderHeight } from "@/components/main-header";
import { useTabScroll } from "@/components/tab-scroll";
import { PracticeCard } from "@/features/quiz/components/practice-card";
import { SPACE } from "@/theme/tokens";

export const HomeScreen = () => {
  const headerHeight = useMainHeaderHeight();
  const onScroll = useTabScroll();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingTop: headerHeight + SPACE.lg }}
    >
      <PracticeCard />
    </ScrollView>
  );
};
