import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";

export const TAB_ICON_SIZE = 32;
const BAR_HEIGHT = 56;

export function AppTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      <View style={styles.icons}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { tabBarAccessibilityLabel, tabBarIcon } = descriptors[route.key].options;

          return (
            <Pressable
              key={route.key}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tabBarAccessibilityLabel}
            >
              {tabBarIcon?.({
                focused,
                color: focused ? COLORS.primary : COLORS.inkMuted,
                size: TAB_ICON_SIZE,
              })}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    backgroundColor: COLORS.background,
  },
  // The two glyphs read as one centered pair, never one per half-width.
  icons: {
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.xl,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: PRESSED,
});
