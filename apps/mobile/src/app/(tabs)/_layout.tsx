import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router/js-tabs";
import { StyleSheet, View } from "react-native";
import { AppHeader } from "@/components/app-header";
import { AppTabBar, TAB_ICON_SIZE } from "@/components/app-tab-bar";
import { TabScrollProvider } from "@/components/tab-scroll";
import { useTabSlide } from "@/components/tab-slide";
import { HOME_TAB_LABEL } from "@/features/quiz/constants";
import { WORLD_TAB_LABEL } from "@/features/world/constants";
import { COLORS } from "@/theme/tokens";

const TabsLayout = () => {
  const slide = useTabSlide();

  return (
    <TabScrollProvider>
      <View style={styles.shell}>
        <Tabs
          tabBar={(props) => {
            const isWorld = props.state.routes[props.state.index].name === "world";
            return (
              <AppTabBar
                {...props}
                isDark={isWorld}
                trackColor={isWorld ? COLORS.ink : COLORS.quiet}
              />
            );
          }}
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
            name="world"
            options={{
              title: WORLD_TAB_LABEL,
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons name="trophy-outline" color={color} size={TAB_ICON_SIZE} />
              ),
            }}
          />
        </Tabs>
        {/* One instance for both tabs, outside the scenes, so it never rides the slide. */}
        <AppHeader />
      </View>
    </TabScrollProvider>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scene: {
    backgroundColor: COLORS.background,
  },
});

export default TabsLayout;
