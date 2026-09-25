import type { BottomTabBarProps as NavigatorTabBarProps } from "expo-router/js-tabs";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, type ColorValue, Pressable, StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { TAB_TRANSITION_EASING, TAB_TRANSITION_MS } from "@/components/tab-transition";
import { useBottomChromeGap } from "@/components/ui/screen-container";
import { Squircle } from "@/components/ui/squircle";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_ICON_SIZE, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

export const TAB_ICON_SIZE = CONTROL_ICON_SIZE;

const TRACK_PADDING = SPACE.xxs;
const TRIGGER_HEIGHT = 49;
const BAR_HEIGHT = TRIGGER_HEIGHT + TRACK_PADDING * 2;

// The bar floats over the screen, so a tab screen pads its content by the whole thing.
export function useBottomTabBarHeight() {
  return useBottomChromeGap() + BAR_HEIGHT;
}

export interface BottomTabBarProps extends NavigatorTabBarProps {
  isDark: boolean;
  trackColor: ColorValue;
}

export const BottomTabBar = ({
  state,
  descriptors,
  navigation,
  isDark,
  trackColor,
}: BottomTabBarProps) => {
  const bottomGap = useBottomChromeGap();
  const [railWidth, setRailWidth] = useState(0);
  const triggerWidth = railWidth / state.routes.length;
  const chipOffset = useChipTravel(state.index, triggerWidth);

  return (
    <View style={[styles.overlay, { paddingBottom: bottomGap }]}>
      <FastSquircleView style={[styles.track, { backgroundColor: trackColor }]}>
        {isDark ? (
          <Squircle
            radius={RADIUS.lg}
            corners="all"
            color={`${COLORS.face}26`}
            borderColor={null}
            borderWidth={null}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          style={styles.rail}
          onLayout={(event) => setRailWidth(event.nativeEvent.layout.width)}
        >
          {/* One chip travels between the triggers, so the selection slides instead of jumping. */}
          {railWidth > 0 ? (
            <Animated.View
              style={[
                styles.chip,
                { width: triggerWidth, transform: [{ translateX: chipOffset }] },
              ]}
              pointerEvents="none"
            >
              <Squircle
                radius={RADIUS.lg}
                color={COLORS.face}
                borderColor={COLORS.ink}
                borderWidth={1}
                style={styles.chipFace}
                corners="all"
              />
            </Animated.View>
          ) : null}
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { title, tabBarIcon } = descriptors[route.key].options;

            return (
              <Pressable
                key={route.key}
                style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
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
                {tabBarIcon?.({
                  focused,
                  color: isDark && !focused ? COLORS.face : COLORS.ink,
                  size: TAB_ICON_SIZE,
                })}
                <Text
                  numberOfLines={1}
                  style={[styles.label, isDark && !focused && styles.lightLabel]}
                >
                  {title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FastSquircleView>
    </View>
  );
};

function useChipTravel(activeIndex: number, triggerWidth: number) {
  const position = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.timing(position, {
      toValue: activeIndex,
      duration: TAB_TRANSITION_MS,
      easing: TAB_TRANSITION_EASING,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, position]);

  return useMemo(() => Animated.multiply(position, triggerWidth), [position, triggerWidth]);
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    marginHorizontal: SPACE.lg,
    pointerEvents: "box-none",
  },
  track: {
    padding: TRACK_PADDING,
    backgroundColor: `${COLORS.catchup}80`,
    borderRadius: RADIUS.round,
  },
  rail: {
    flexDirection: "row",
  },
  chip: {
    position: "absolute",
    top: 0,
    left: 0,
    height: TRIGGER_HEIGHT,
  },
  chipFace: {
    flex: 1,
  },
  trigger: {
    flex: 1,
    height: TRIGGER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.sm,
    paddingHorizontal: SPACE.sm,
  },
  label: {
    ...TEXT.label,
    flexShrink: 1,
    color: COLORS.ink,
    userSelect: "none",
  },
  lightLabel: { color: COLORS.face },
  pressed: PRESSED,
});
