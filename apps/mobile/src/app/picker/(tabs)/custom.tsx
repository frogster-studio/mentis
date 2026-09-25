import { ScrollView } from "react-native";
import { useMainHeaderHeight } from "@/components/main-header";
import { useTabScroll } from "@/components/tab-scroll";
import { SPACE } from "@/theme/tokens";

export default function Page() {
  const headerHeight = useMainHeaderHeight();
  const onScroll = useTabScroll();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingTop: headerHeight + SPACE.lg }}
    />
  );
}
