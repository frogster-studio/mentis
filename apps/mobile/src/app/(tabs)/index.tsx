import { Redirect } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { useMainHeaderHeight } from "@/components/main-header";
import { useTabScroll } from "@/components/tab-scroll";
import { useOnboardingStore } from "@/features/onboarding/store";
import { PracticeCard } from "@/features/quiz/components/practice-card";
import { SPACE } from "@/theme/tokens";

export default function Page() {
  const hasOnboarded = useOnboardingStore((state) => state.hasOnboarded);
  const headerHeight = useMainHeaderHeight();
  const onScroll = useTabScroll();

  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }

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
}
