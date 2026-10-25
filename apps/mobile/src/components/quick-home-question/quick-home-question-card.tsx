import { StyleSheet, Text } from "react-native";
import { useQuickHomeQuestionDaySet } from "@/features/quick-home-question/api";
import { quickHomeQuestionCounterTag } from "@/features/quick-home-question/constants";
import { topTile } from "@/features/quick-home-question/day-set";
import { TEXT } from "@/theme/text";
import { COLORS } from "@/theme/tokens";

export const QuickHomeQuestionCard = () => {
  const { daySet } = useQuickHomeQuestionDaySet();

  if (daySet === null || topTile(daySet) === null) {
    return null;
  }

  return (
    <Text style={styles.tag}>
      {quickHomeQuestionCounterTag(daySet.results.length, daySet.tiles.length)}
    </Text>
  );
};

const styles = StyleSheet.create({
  tag: { ...TEXT.label, color: COLORS.ink },
});
