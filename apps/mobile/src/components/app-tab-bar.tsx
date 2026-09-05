import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, type LayoutRectangle, Pressable, StyleSheet, Text, View } from "react-native";
import { TAB_TRANSITION_EASING, TAB_TRANSITION_MS } from "@/components/tab-transition";
import { useBottomChromeGap } from "@/components/ui/screen-container";
import { Squircle } from "@/components/ui/squircle";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_ICON_SIZE, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

export const TAB_ICON_SIZE = CONTROL_ICON_SIZE;

const TRACK_PADDING = SPACE.xxs;
const TRIGGER_HEIGHT = 49;
const BAR_HEIGHT = TRIGGER_HEIGHT + TRACK_PADDING * 2;

type TriggerFrame = { x: number; width: number };

const TRAVEL = {
  duration: TAB_TRANSITION_MS,
  easing: TAB_TRANSITION_EASING,
  useNativeDriver: false,
} as const;

// The bar floats over the screen, so a tab screen pads its content by the whole thing.
export function useAppTabBarHeight() {
  return useBottomChromeGap() + BAR_HEIGHT;
}

export const AppTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const bottomGap = useBottomChromeGap();
  const [frames, setFrames] = useState<Record<string, TriggerFrame>>({});
  const activeFrame = frames[state.routes[state.index].key];
  const chip = useChipTravel(activeFrame);

  const measureTrigger = useCallback((key: string, layout: LayoutRectangle) => {
    setFrames((current) => {
      const known = current[key];
      if (known && known.x === layout.x && known.width === layout.width) {
        return current;
      }
      return { ...current, [key]: { x: layout.x, width: layout.width } };
    });
  }, []);

  return (
    <View style={[styles.overlay, { paddingBottom: bottomGap }]}>
      <Squircle
        radius={RADIUS.lg}
        color={COLORS.quiet}
        style={styles.track}
        corners="all"
        borderColor={null}
        borderWidth={null}
      >
        <View style={styles.rail}>
          {/* One chip travels between the triggers, so the selection slides instead of jumping. */}
          {activeFrame ? (
            <Animated.View style={[styles.chip, chip]} pointerEvents="none">
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
                onLayout={(event) => measureTrigger(route.key, event.nativeEvent.layout)}
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
                {tabBarIcon?.({ focused, color: COLORS.ink, size: TAB_ICON_SIZE })}
                <Text style={styles.label}>{title}</Text>
              </Pressable>
            );
          })}
        </View>
      </Squircle>
    </View>
  );
};

// Width and left are laid-out values, so the travel runs on the JS driver.
function useChipTravel(frame: TriggerFrame | undefined) {
  const left = useRef(new Animated.Value(0)).current;
  const width = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);
  const x = frame?.x;
  const measuredWidth = frame?.width;

  useEffect(() => {
    if (x === undefined || measuredWidth === undefined) {
      return;
    }
    if (!placed.current) {
      placed.current = true;
      left.setValue(x);
      width.setValue(measuredWidth);
      return;
    }
    Animated.parallel([
      Animated.timing(left, { toValue: x, ...TRAVEL }),
      Animated.timing(width, { toValue: measuredWidth, ...TRAVEL }),
    ]).start();
  }, [x, measuredWidth, left, width]);

  return { left, width };
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
    padding: TRACK_PADDING,
  },
  rail: {
    flexDirection: "row",
  },
  chip: {
    position: "absolute",
    top: 0,
    height: TRIGGER_HEIGHT,
  },
  chipFace: {
    flex: 1,
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
