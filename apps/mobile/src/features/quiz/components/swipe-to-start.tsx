import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { Squircle } from "@/components/ui/squircle";
import { PRESS_DEPTH } from "@/components/ui/use-press-sink";
import { PICKER_SWIPE_LABEL } from "@/features/quiz/constants";
import { useColorCrossFade } from "@/features/quiz/use-color-cross-fade";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, CONTROL_ICON_SIZE, RADIUS, SPACE } from "@/theme/tokens";
import type { Category } from "@/types/quiz";

const TRACK_PADDING = PRESS_DEPTH;
const TRACK_HEIGHT = CONTROL_HEIGHT + PRESS_DEPTH + TRACK_PADDING * 2;
// The mockup's pill spans 276 of the track's 388 inner points.
const PILL_FRACTION = 276 / 388;
const CONFIRM_FRACTION = 0.6;
const SETTLE_MS = 120;
const CHEVRON_STEP = SPACE.md;
const CHEVRON_CLUSTER_WIDTH = CONTROL_ICON_SIZE + CHEVRON_STEP * 2;
// The chevrons sit on the track's Category fill, so paper laid over it is the wash.
const CHEVRON_PAPER_ALPHA = "C7";
const CHEVRON_SHIMMY = 6;
const CHEVRON_SHIMMY_MS = 450;
const CHEVRON_REST_MS = 600;
const REVEAL_MS = 250;
// Web has no native animated module; it falls back to JS anyway.
const NATIVE_DRIVER = Platform.OS !== "web";

export interface SwipeToStartProps {
  // Nothing picked yet leaves the empty trough waiting.
  category: Category | null;
  onStart: () => void;
}

export const SwipeToStart = ({ category, onStart }: SwipeToStartProps) => {
  const insets = useSafeAreaInsets();
  const fill = useColorCrossFade(category?.color ?? null);
  const reveal = useReveal(category !== null);
  const [innerWidth, setInnerWidth] = useState(0);
  const pillWidth = Math.round(innerWidth * PILL_FRACTION);
  const maxTravel = Math.max(innerWidth - pillWidth, 0);
  const { drag, panHandlers } = useDragToConfirm(maxTravel, onStart);
  const chevronShift = useChevronShimmy();

  return (
    <View style={[styles.overlay, { paddingBottom: bottomGap(insets.bottom) }]}>
      <View style={styles.band}>
        <View style={styles.track}>
          <Squircle
            radius={RADIUS.lg}
            color={COLORS.trough}
            style={StyleSheet.absoluteFill}
            corners="all"
            borderColor={null}
            borderWidth={null}
          />
          {fill.base ? (
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: fill.baseOpacity }]}>
              <Squircle
                radius={RADIUS.lg}
                color={fill.base}
                style={styles.fill}
                corners="all"
                borderColor={null}
                borderWidth={null}
              />
            </Animated.View>
          ) : null}
          {fill.top ? (
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: fill.topOpacity }]}>
              <Squircle
                radius={RADIUS.lg}
                color={fill.top}
                style={styles.fill}
                corners="all"
                borderColor={null}
                borderWidth={null}
              />
            </Animated.View>
          ) : null}
          {category ? (
            <Animated.View
              style={[styles.inner, { opacity: reveal }]}
              onLayout={(event) => setInnerWidth(event.nativeEvent.layout.width)}
            >
              <Animated.View
                style={[
                  styles.chevrons,
                  // Centred in the free zone right of the pill, where the travel ends.
                  { right: Math.max((maxTravel - CHEVRON_CLUSTER_WIDTH) / 2, 0) },
                  { transform: [{ translateX: chevronShift }] },
                ]}
                pointerEvents="none"
              >
                {[0, 1, 2].map((position) => (
                  <MaterialCommunityIcons
                    key={position}
                    name="chevron-double-right"
                    size={CONTROL_ICON_SIZE}
                    color={`${COLORS.background}${CHEVRON_PAPER_ALPHA}`}
                    style={position > 0 ? styles.chevronOverlap : null}
                  />
                ))}
              </Animated.View>
              <Animated.View
                {...panHandlers}
                style={[styles.pill, { width: pillWidth, transform: [{ translateX: drag }] }]}
              >
                <Squircle
                  radius={RADIUS.lg}
                  color={COLORS.ink}
                  style={styles.pillEdge}
                  corners="all"
                  borderColor={null}
                  borderWidth={null}
                />
                <Squircle
                  radius={RADIUS.lg}
                  color={COLORS.face}
                  borderColor={COLORS.ink}
                  borderWidth={1}
                  style={styles.pillFace}
                  corners="all"
                >
                  <MaterialCommunityIcons
                    name="gesture-swipe-right"
                    size={CONTROL_ICON_SIZE}
                    color={COLORS.ink}
                  />
                  <Text style={styles.pillLabel} numberOfLines={1}>
                    {PICKER_SWIPE_LABEL}
                  </Text>
                </Squircle>
              </Animated.View>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

function useDragToConfirm(maxTravel: number, onStart: () => void) {
  const drag = useRef(new Animated.Value(0)).current;

  // Coming back to the screen re-arms a pill that already ran its travel out.
  useFocusEffect(
    useCallback(() => {
      drag.setValue(0);
    }, [drag]),
  );

  const panHandlers = useMemo(() => {
    const settleBack = () =>
      Animated.timing(drag, {
        toValue: 0,
        duration: SETTLE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      }).start();

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) && gesture.dx > 0,
      onPanResponderMove: (_, gesture) =>
        drag.setValue(Math.min(Math.max(gesture.dx, 0), maxTravel)),
      onPanResponderRelease: (_, gesture) => {
        if (maxTravel > 0 && gesture.dx >= maxTravel * CONFIRM_FRACTION) {
          Animated.timing(drag, {
            toValue: maxTravel,
            duration: SETTLE_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: NATIVE_DRIVER,
          }).start(({ finished }) => {
            if (finished) {
              onStart();
            }
          });
        } else {
          settleBack();
        }
      },
      onPanResponderTerminate: settleBack,
    }).panHandlers;
  }, [drag, maxTravel, onStart]);

  return { drag, panHandlers };
}

function useReveal(isRevealed: boolean) {
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: isRevealed ? 1 : 0,
      duration: REVEAL_MS,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [isRevealed, reveal]);

  return reveal;
}

// The chevrons breathe toward the travel's end, so the pill's way out reads at a glance.
function useChevronShimmy() {
  const shift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmy = Animated.loop(
      Animated.sequence([
        Animated.timing(shift, {
          toValue: CHEVRON_SHIMMY,
          duration: CHEVRON_SHIMMY_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: NATIVE_DRIVER,
        }),
        Animated.timing(shift, {
          toValue: 0,
          duration: CHEVRON_SHIMMY_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: NATIVE_DRIVER,
        }),
        Animated.delay(CHEVRON_REST_MS),
      ]),
    );
    shimmy.start();
    return () => shimmy.stop();
  }, [shift]);

  return shift;
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
  band: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: SPACE.md,
    pointerEvents: "box-none",
  },
  track: {
    height: TRACK_HEIGHT,
  },
  fill: {
    flex: 1,
  },
  inner: {
    flex: 1,
    margin: TRACK_PADDING,
    justifyContent: "center",
  },
  chevrons: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
  },
  chevronOverlap: {
    marginLeft: CHEVRON_STEP - CONTROL_ICON_SIZE,
  },
  pill: {
    height: CONTROL_HEIGHT + PRESS_DEPTH,
  },
  pillEdge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: CONTROL_HEIGHT,
  },
  pillFace: {
    height: CONTROL_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.sm,
    paddingHorizontal: SPACE.lg,
  },
  pillLabel: {
    ...TEXT.label,
    color: COLORS.ink,
    userSelect: "none",
  },
});
