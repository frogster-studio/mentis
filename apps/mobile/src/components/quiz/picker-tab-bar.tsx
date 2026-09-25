import type { BottomTabBarProps } from "expo-router/js-tabs";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { usePicker } from "@/components/quiz/picker-provider";
import { COLORS } from "@/theme/tokens";

export const PickerTabBar = (props: BottomTabBarProps) => {
  const { selected } = usePicker();

  return (
    <BottomTabBar {...props} isDark={false} trackColor={selected?.category.color ?? COLORS.quiet} />
  );
};
