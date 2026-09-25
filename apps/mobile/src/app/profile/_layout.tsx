import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router/js-tabs";
import { StyleSheet, View } from "react-native";
import { BottomTabBar, TAB_ICON_SIZE } from "@/components/bottom-tab-bar";
import { useTabSlide } from "@/components/tab-slide";
import { PaperBackground } from "@/components/ui/paper-background";
import { ProfileHeader } from "@/features/account/components/profile-header";
import { ProfileWash } from "@/features/account/components/profile-wash";
import {
  PROFILE_ACCOUNT_TAB_LABEL,
  PROFILE_HISTORY_TAB_LABEL,
  PROFILE_STATS_TAB_LABEL,
} from "@/features/account/constants";
import { COLORS } from "@/theme/tokens";

export default function Layout() {
  const slide = useTabSlide();

  return (
    <View style={styles.shell}>
      {/* One paper and wash for every tab, under the clear scenes, so neither rides the slide. */}
      <PaperBackground isDark={false} />
      <ProfileWash />
      {/* Above the scenes, not over them, so the card holds still while the tabs slide under it. */}
      <ProfileHeader />
      {/* Back leaves Profile for the Home or World it was opened from, never an earlier tab. */}
      <Tabs
        backBehavior="none"
        tabBar={(props) => <BottomTabBar {...props} isDark={false} trackColor={"#B3D2E5"} />}
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
            title: PROFILE_ACCOUNT_TAB_LABEL,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="cog-outline" color={color} size={TAB_ICON_SIZE} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: COLORS.background },
  scene: { backgroundColor: COLORS.clear },
});
