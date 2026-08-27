import { type ReactNode, useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const SPEED_PX_PER_SECOND = 24;
const FADE_WIDTH = 47;
const FADE_SOLID_STOP = 0.25;
// Web has no native animated module and warns on every frame; it falls back to JS anyway.
const NATIVE_DRIVER = Platform.OS !== "web";

export type MarqueeProps = {
  children: ReactNode;
  gap: number;
  fadeColor: string;
};

export function Marquee({ children, gap, fadeColor }: MarqueeProps) {
  const [runWidth, setRunWidth] = useState(0);
  const travel = useRef(new Animated.Value(0)).current;
  const period = runWidth + gap;

  useEffect(() => {
    if (runWidth === 0) return;
    travel.setValue(0);
    const loop = Animated.loop(
      Animated.timing(travel, {
        toValue: -period,
        duration: (period / SPEED_PX_PER_SECOND) * 1000,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [runWidth, period, travel]);

  return (
    <View style={styles.viewport}>
      <Animated.View style={[styles.row, { gap, transform: [{ translateX: travel }] }]}>
        <View
          style={[styles.row, { gap }]}
          onLayout={(event) => setRunWidth(event.nativeEvent.layout.width)}
        >
          {children}
        </View>
        {/* The second run carries the loop: the first is back at its start the moment it leaves. */}
        <View style={[styles.row, { gap }]}>{children}</View>
      </Animated.View>
      <EdgeFade color={fadeColor} side="left" />
      <EdgeFade color={fadeColor} side="right" />
    </View>
  );
}

function EdgeFade({ color, side }: { color: string; side: "left" | "right" }) {
  const id = `marquee-fade-${side}`;
  const solidFirst = side === "left";

  return (
    <Svg style={[styles.fade, styles[side]]} width={FADE_WIDTH} height="100%">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} stopOpacity={solidFirst ? 1 : 0} />
          <Stop
            offset={solidFirst ? FADE_SOLID_STOP : 1 - FADE_SOLID_STOP}
            stopColor={color}
            stopOpacity={1}
          />
          <Stop offset="1" stopColor={color} stopOpacity={solidFirst ? 0 : 1} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: "hidden",
    pointerEvents: "none",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  fade: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  left: { left: 0 },
  right: { right: 0 },
});
