import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Squircle } from "@/components/ui/squircle";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_ICON_SIZE, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

export const TAB_ICON_SIZE = CONTROL_ICON_SIZE;

const TRACK_PADDING = SPACE.xxs;
const TRIGGER_HEIGHT = 49;
const BAR_HEIGHT = TRIGGER_HEIGHT + TRACK_PADDING * 2;

// The bar floats over the screen, so a tab screen pads its content by the whole thing.
export function useAppTabBarHeight() {
  return bottomGap(useSafeAreaInsets().bottom) + BAR_HEIGHT;
}

export function AppTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.overlay, { paddingBottom: bottomGap(insets.bottom) }]}>
      <Squircle radius={RADIUS.lg} color={COLORS.quiet} style={styles.track}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { title, tabBarIcon } = descriptors[route.key].options;
          const content = (
            <>
              {tabBarIcon?.({ focused, color: COLORS.ink, size: TAB_ICON_SIZE })}
              <Text style={styles.label}>{title}</Text>
            </>
          );

          return (
            <Pressable
              key={route.key}
              style={({ pressed }) => pressed && styles.pressed}
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
              accessibilityLabel={title}
            >
              {focused ? (
                <Squircle
                  radius={RADIUS.lg}
                  color={COLORS.face}
                  borderColor={COLORS.ink}
                  borderWidth={1}
                  style={styles.trigger}
                >
                  {content}
                </Squircle>
              ) : (
                <View style={styles.trigger}>{content}</View>
              )}
            </Pressable>
          );
        })}
      </Squircle>
    </View>
  );
}

// A phone with no home indicator would otherwise sit the bar flat on the screen edge.
function bottomGap(inset: number): number {
  return Math.max(inset, SPACE.lg);
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  track: {
    flexDirection: "row",
    padding: TRACK_PADDING,
  },
  trigger: {
    height: TRIGGER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.sm,
    paddingHorizontal: SPACE.xl,
  },
  label: {
    ...TEXT.label,
    color: COLORS.ink,
    userSelect: "none",
  },
  pressed: PRESSED,
});
