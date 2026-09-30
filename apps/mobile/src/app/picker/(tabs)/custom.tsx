import { ScrollView } from "react-native";
import { useMainHeaderHeight } from "@/components/main-header";
import { MAIN_SUB_HEADER_VISIBLE_HEIGHT } from "@/components/main-sub-header";
import { useTabScroll } from "@/components/tab-scroll";
import { SPACE } from "@/theme/tokens";

export default function Page() {
  const headerHeight = useMainHeaderHeight() + MAIN_SUB_HEADER_VISIBLE_HEIGHT;
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
