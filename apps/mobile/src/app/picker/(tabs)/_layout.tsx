import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router/js-tabs";
import { StyleSheet, View } from "react-native";
import { TAB_ICON_SIZE } from "@/components/bottom-tab-bar";
import { PickerBackground } from "@/components/quiz/picker-background";
import { PickerHeader } from "@/components/quiz/picker-header";
import { PickerProvider } from "@/components/quiz/picker-provider";
import { PickerStartButton } from "@/components/quiz/picker-start-button";
import { PickerTabBar } from "@/components/quiz/picker-tab-bar";
import { TabScrollProvider } from "@/components/tab-scroll";
import { useTabSlide } from "@/components/tab-slide";
import { PICKER_CLASSIC_TAB_LABEL, PICKER_CUSTOM_TAB_LABEL } from "@/features/quiz/constants";
import { COLORS } from "@/theme/tokens";

export default function Layout() {
  const slide = useTabSlide();

  return (
    <PickerProvider>
      <TabScrollProvider>
        <View style={styles.shell}>
          {/* One paper and wash for both tabs, under the clear scenes, so neither rides the slide. */}
          <PickerBackground />
          <Tabs
            tabBar={(props) => <PickerTabBar {...props} />}
            screenOptions={{ headerShown: false, sceneStyle: styles.scene, ...slide }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: PICKER_CLASSIC_TAB_LABEL,
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
              name="custom"
              options={{
                title: PICKER_CUSTOM_TAB_LABEL,
                tabBarIcon: ({ color }) => (
                  <MaterialCommunityIcons name="tune-variant" color={color} size={TAB_ICON_SIZE} />
                ),
              }}
            />
          </Tabs>
          <PickerHeader />
          <PickerStartButton />
        </View>
      </TabScrollProvider>
    </PickerProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scene: {
    backgroundColor: COLORS.clear,
  },
});
