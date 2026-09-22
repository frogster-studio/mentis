import { Animated, StyleSheet, View } from "react-native";
import type { ColorCrossFade } from "@/features/quiz/use-color-cross-fade";

export const WASH_ALPHA = "38";

interface SelectionWashProps {
  wash: ColorCrossFade;
}

// The wash rides between the paper's grid and the content, so the squares keep showing through.
export const SelectionWash = ({ wash }: SelectionWashProps) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {wash.base ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: wash.base, opacity: wash.baseOpacity },
          ]}
        />
      ) : null}
      {wash.top ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: wash.top, opacity: wash.topOpacity }]}
        />
      ) : null}
    </View>
  );
};
