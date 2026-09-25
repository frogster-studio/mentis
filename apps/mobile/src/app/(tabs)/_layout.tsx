import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { usePathname } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { StyleSheet } from "react-native";
import { TAB_ICON_SIZE } from "@/components/bottom-tab-bar";
import { MainTabBar, WORLD_ROUTE } from "@/components/main-tab-bar";
import { PlayerHeader, WORLD_PATH } from "@/components/player-header";
import { TabScrollProvider } from "@/components/tab-scroll";
import { useTabSlide } from "@/components/tab-slide";
import { PaperBackground } from "@/components/ui/paper-background";
import { HOME_TAB_LABEL } from "@/features/quiz/constants";
import { WORLD_TAB_LABEL } from "@/features/world/constants";
import { COLORS } from "@/theme/tokens";

export default function Layout() {
  const slide = useTabSlide();
  const isWorld = usePathname() === WORLD_PATH;

  return (
    <TabScrollProvider>
      {/* One paper for both tabs, under the transparent scenes, so it never rides the slide. */}
      <PaperBackground isDark={isWorld} />

      <Tabs
        tabBar={(props) => <MainTabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: styles.scene, ...slide }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: HOME_TAB_LABEL,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="animation-play-outline"
                color={color}
                size={TAB_ICON_SIZE}
              />
            ),
          }}
        />
        <Tabs.Screen
          name={WORLD_ROUTE}
          options={{
            title: WORLD_TAB_LABEL,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="trophy-outline" color={color} size={TAB_ICON_SIZE} />
            ),
          }}
        />
      </Tabs>

      <PlayerHeader isWorld={isWorld} />
    </TabScrollProvider>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: COLORS.clear,
  },
});
