import type { BottomTabBarProps } from "expo-router/js-tabs";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { COLORS } from "@/theme/tokens";

export const WORLD_ROUTE = "world";

// The pathname lands a render after the tab state, so the bar reads the state its chip follows.
export const MainTabBar = (props: BottomTabBarProps) => {
  const isWorldTab = props.state.routes[props.state.index].name === WORLD_ROUTE;

  return (
    <BottomTabBar
      {...props}
      isDark={isWorldTab}
      trackColor={isWorldTab ? COLORS.bordeau : COLORS.quiet}
    />
  );
};
