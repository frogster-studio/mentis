import type { BottomTabBarProps } from "expo-router/js-tabs";
import { ProfileBottomFade } from "@/components/account/profile-bottom-fade";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { COLORS } from "@/theme/tokens";

export const ProfileTabBar = (props: BottomTabBarProps) => {
  return (
    <>
      <ProfileBottomFade />
      <BottomTabBar {...props} isDark={false} trackColor={COLORS.catchupTrack} />
    </>
  );
};
