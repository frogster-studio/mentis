import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router/js-tabs";
import { Easing, StyleSheet, useWindowDimensions, View } from "react-native";
import { AppHeader } from "@/components/app-header";
import { AppTabBar, TAB_ICON_SIZE } from "@/components/app-tab-bar";
import { HOME_TAB_LABEL } from "@/features/quiz/constants";
import { WORLD_TAB_LABEL } from "@/features/world/constants";
import { COLORS } from "@/theme/tokens";

const SLIDE_DURATION_MS = 250;

export default function TabsLayout() {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.shell}>
      <Tabs
        tabBar={(props) => <AppTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          // Both tabs stay mounted so the incoming one is already drawn when the slide starts.
          lazy: false,
          sceneStyle: styles.scene,
          transitionSpec: {
            animation: "timing",
            config: { duration: SLIDE_DURATION_MS, easing: Easing.out(Easing.cubic) },
          },
          // The tabs ride one filmstrip: the outgoing screen leaves exactly as the incoming arrives.
          sceneStyleInterpolator: ({ current }) => ({
            sceneStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-width, 0, width],
                  }),
                },
              ],
            },
          }),
        }}
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
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scene: {
    backgroundColor: COLORS.background,
  },
});
