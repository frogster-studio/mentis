import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet } from "react-native";
import { COLORS, CONTROL_ICON_SIZE, SPACE } from "@/theme/tokens";

const CHEVRONS = [0, 1, 2];
const STEP = SPACE.md;
const TRAVEL = SPACE.xs;
const DURATION_MS = 450;
// The chevrons sit on a Category fill, so paper laid over it is the wash.
const CHEVRON_COLOR = `${COLORS.background}C7`;
const NATIVE_DRIVER = Platform.OS !== "web";

export const AnimatedChevrons = () => {
  const shift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const slide = (toValue: number) =>
      Animated.timing(shift, { toValue, duration: DURATION_MS, useNativeDriver: NATIVE_DRIVER });
    const loop = Animated.loop(Animated.sequence([slide(TRAVEL), slide(0)]));
    loop.start();
    return () => loop.stop();
  }, [shift]);

  return (
    <Animated.View style={[styles.row, { transform: [{ translateX: shift }] }]}>
      {CHEVRONS.map((index) => (
        <MaterialCommunityIcons
          key={index}
          name="chevron-double-right"
          size={CONTROL_ICON_SIZE}
          color={CHEVRON_COLOR}
          style={index > 0 ? styles.overlap : null}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  overlap: { marginLeft: STEP - CONTROL_ICON_SIZE },
});
