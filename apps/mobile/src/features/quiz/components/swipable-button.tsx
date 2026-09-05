import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MAX_CONTENT_WIDTH, useBottomChromeGap } from "@/components/ui/screen-container";
import { AnimatedChevrons } from "@/features/quiz/components/animated-chevrons";
import { PICKER_START_LABEL, PICKER_SWIPE_LABEL } from "@/features/quiz/constants";
import { useColorCrossFade } from "@/features/quiz/use-color-cross-fade";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, CONTROL_ICON_SIZE, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

const TRACK_PADDING = 6;
const BUTTON_SHADOW_OFFSET = 4;
const PILL_FRACTION = 0.7;
const CONFIRM_FRACTION = 0.6;
const SETTLE_MS = 120;
const REVEAL_MS = 250;
const NATIVE_DRIVER = Platform.OS !== "web";
// Web has no swipe: the pill is a plain click, so it says so.
const IS_WEB = Platform.OS === "web";

export interface SwipableButtonProps {
  // Nothing picked yet leaves the empty trough waiting.
  color: string | null;
  start: () => void;
}

export const SwipableButton = ({ color, start }: SwipableButtonProps) => {
  const bottomGap = useBottomChromeGap();
  const fill = useColorCrossFade(color);
  const reveal = useFade(color !== null);
  const [innerWidth, setInnerWidth] = useState(0);
  const pillWidth = Math.round(innerWidth * PILL_FRACTION);
  const { drag, panHandlers } = useSwipeToConfirm(innerWidth - pillWidth, start);

  const face = (
    <>
      <MaterialCommunityIcons
        name={IS_WEB ? "play-circle-outline" : "gesture-swipe-right"}
        size={CONTROL_ICON_SIZE}
        color={COLORS.ink}
      />
      <Text style={styles.label} numberOfLines={1}>
        {IS_WEB ? PICKER_START_LABEL : PICKER_SWIPE_LABEL}
      </Text>
    </>
  );

  return (
    <View style={[styles.overlay, { paddingBottom: bottomGap }]}>
      <View style={styles.band}>
        <View style={styles.track}>
          {fill.base ? (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: fill.base, opacity: fill.baseOpacity },
              ]}
            />
          ) : null}
          {fill.top ? (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: fill.top, opacity: fill.topOpacity },
              ]}
            />
          ) : null}
          <Animated.View
            style={[styles.inner, { opacity: reveal }]}
            pointerEvents={color ? "auto" : "none"}
            onLayout={(event) => setInnerWidth(event.nativeEvent.layout.width)}
          >
            <View style={[StyleSheet.absoluteFill, styles.chevronSlot]} pointerEvents="none">
              <AnimatedChevrons />
            </View>
            {IS_WEB ? (
              <Pressable
                style={({ pressed }) => [styles.pill, { width: pillWidth }, pressed && PRESSED]}
                onPress={start}
              >
                {face}
              </Pressable>
            ) : (
              <Animated.View
                {...panHandlers}
                style={[styles.pill, { width: pillWidth, transform: [{ translateX: drag }] }]}
              >
                {face}
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

function useFade(isVisible: boolean) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isVisible ? 1 : 0,
      duration: REVEAL_MS,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [isVisible, opacity]);

  return opacity;
}

function useSwipeToConfirm(maxTravel: number, start: () => void) {
  const drag = useRef(new Animated.Value(0)).current;

  // Coming back to the screen re-arms a pill that already ran its travel out.
  useFocusEffect(
    useCallback(() => {
      drag.setValue(0);
    }, [drag]),
  );

  const panHandlers = useMemo(() => {
    const settle = (toValue: number, onDone?: () => void) =>
      Animated.timing(drag, {
        toValue,
        duration: SETTLE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      }).start(onDone);

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dx > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) =>
        drag.setValue(Math.min(Math.max(gesture.dx, 0), maxTravel)),
      onPanResponderRelease: (_, gesture) =>
        gesture.dx >= maxTravel * CONFIRM_FRACTION && maxTravel > 0
          ? settle(maxTravel, start)
          : settle(0),
      onPanResponderTerminate: () => settle(0),
    }).panHandlers;
  }, [drag, maxTravel, start]);

  return { drag, panHandlers };
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
  band: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: SPACE.md,
    pointerEvents: "box-none",
  },
  track: {
    height: CONTROL_HEIGHT + TRACK_PADDING * 2,
    padding: TRACK_PADDING,
    paddingBottom: TRACK_PADDING + BUTTON_SHADOW_OFFSET,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.trough,
    overflow: "hidden",
  },
  inner: { flex: 1, justifyContent: "center" },
  chevronSlot: {
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: SPACE.lg,
  },
  pill: {
    height: CONTROL_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.ink,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: BUTTON_SHADOW_OFFSET },
    shadowOpacity: 1,
    elevation: 5,
  },
  label: { ...TEXT.label, color: COLORS.ink, userSelect: "none" },
});
