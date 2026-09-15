import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router/js-tabs";
import { StyleSheet, View } from "react-native";
import { AppTabBar, TAB_ICON_SIZE } from "@/components/app-tab-bar";
import { useTabSlide } from "@/components/tab-slide";
import { PaperBackground } from "@/components/ui/paper-background";
import { ProfileHeader } from "@/features/account/components/profile-header";
import { PROFILE_WASH, ProfileWash } from "@/features/account/components/profile-wash";
import {
  PROFILE_HISTORY_TAB_LABEL,
  PROFILE_INFOS_TAB_LABEL,
  PROFILE_STATS_TAB_LABEL,
} from "@/features/account/constants";
import { COLORS } from "@/theme/tokens";

export const ProfileTabs = () => {
  const slide = useTabSlide();

  return (
    <View style={styles.shell}>
      <PaperBackground isDark={false} />
      <ProfileWash />
      {/* Above the scenes, not over them, so the card holds still while the tabs slide under it. */}
      <ProfileHeader />
      <Tabs
        tabBar={(props) => <AppTabBar {...props} isDark={false} trackColor={PROFILE_WASH} />}
        screenOptions={{ headerShown: false, sceneStyle: styles.scene, ...slide }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: PROFILE_STATS_TAB_LABEL,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="chart-bar" color={color} size={TAB_ICON_SIZE} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: PROFILE_HISTORY_TAB_LABEL,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="history" color={color} size={TAB_ICON_SIZE} />
            ),
          }}
        />
        <Tabs.Screen
          name="infos"
          options={{
            title: PROFILE_INFOS_TAB_LABEL,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="information-outline"
                color={color}
                size={TAB_ICON_SIZE}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scene: {
    backgroundColor: COLORS.clear,
  },
});
