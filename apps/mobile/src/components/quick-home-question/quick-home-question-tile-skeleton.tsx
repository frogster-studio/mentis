import { StyleSheet, View } from "react-native";
import { CATEGORY_BADGE_RADIUS, CATEGORY_BADGE_SIZE } from "@/components/category-badge";
import { QUICK_HOME_QUESTION_CHOICE_HEIGHT } from "@/components/quick-home-question/quick-home-question-choice-button";
import { QUICK_HOME_QUESTION_DOT_SIZE } from "@/components/quick-home-question/quick-home-question-dots";
import { Skeleton } from "@/components/ui/skeleton";
import { QUICK_HOME_QUESTION_COUNT } from "@/features/quick-home-question/constants";
import { TEXT } from "@/theme/text";
import { RADIUS, SPACE } from "@/theme/tokens";

const THEME_NAME_WIDTH = 96;
const SHORT_LINE_WIDTH = "60%";

const DOT_POSITIONS = Array.from({ length: QUICK_HOME_QUESTION_COUNT }, (_, index) => index);

export const QuickHomeQuestionTileSkeleton = () => {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Skeleton style={styles.badge} />
        <Skeleton style={styles.themeName} />
      </View>
      <View>
        <Skeleton style={styles.textLine} />
        <Skeleton style={[styles.textLine, styles.shortTextLine]} />
      </View>
      <View style={styles.choices}>
        <Skeleton style={styles.choice} />
        <Skeleton style={styles.choice} />
      </View>
      <View style={styles.dots}>
        {DOT_POSITIONS.map((dotPosition) => (
          <Skeleton key={dotPosition} style={styles.dot} />
        ))}
      </View>
    </View>
  );
};

// A bar as tall as the glyphs, centred in the line it stands in for.
function lineBar(text: { fontSize: number; lineHeight: number }) {
  return {
    height: text.fontSize,
    marginVertical: (text.lineHeight - text.fontSize) / 2,
    borderRadius: RADIUS.sm,
  };
}

const styles = StyleSheet.create({
  root: { gap: SPACE.md },
  header: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  badge: {
    width: CATEGORY_BADGE_SIZE,
    height: CATEGORY_BADGE_SIZE,
    borderRadius: CATEGORY_BADGE_RADIUS,
  },
  themeName: { ...lineBar(TEXT.label), width: THEME_NAME_WIDTH },
  textLine: lineBar(TEXT.cardTitle),
  shortTextLine: { width: SHORT_LINE_WIDTH },
  choices: { flexDirection: "row", gap: SPACE.sm },
  choice: { flex: 1, height: QUICK_HOME_QUESTION_CHOICE_HEIGHT, borderRadius: RADIUS.base },
  dots: { flexDirection: "row", justifyContent: "center", gap: SPACE.xs },
  dot: {
    width: QUICK_HOME_QUESTION_DOT_SIZE,
    height: QUICK_HOME_QUESTION_DOT_SIZE,
    borderRadius: RADIUS.round,
  },
});
