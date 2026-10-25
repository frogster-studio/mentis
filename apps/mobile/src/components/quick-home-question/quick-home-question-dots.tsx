import { StyleSheet, View } from "react-native";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

export const QUICK_HOME_QUESTION_DOT_SIZE = 6;
const IDLE_DOT_ALPHA = "33";

export interface QuickHomeQuestionDotsProps {
  position: number;
  total: number;
}

export const QuickHomeQuestionDots = ({ position, total }: QuickHomeQuestionDotsProps) => {
  const dotPositions = Array.from({ length: total }, (_, index) => index);

  return (
    <View style={styles.row}>
      {dotPositions.map((dotPosition) => (
        <View key={dotPosition} style={[styles.dot, dotPosition !== position && styles.idleDot]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: SPACE.xs },
  dot: {
    width: QUICK_HOME_QUESTION_DOT_SIZE,
    height: QUICK_HOME_QUESTION_DOT_SIZE,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.ink,
  },
  idleDot: { backgroundColor: `${COLORS.ink}${IDLE_DOT_ALPHA}` },
});
