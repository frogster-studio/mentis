import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { iconNameOrFallback } from "@/components/ui/icon-name";
import {
  STATS_AVERAGE_COLUMN,
  STATS_BEST_COLUMN,
  STATS_GAMES_COLUMN,
  STATS_TABLE_TITLE,
} from "@/features/account/constants";
import { countFigure, scoreFigure } from "@/features/account/stat-figures";
import { RESULTS_SCORE_MAX_LABEL } from "@/features/quiz/constants";
import type { CategoryGroup } from "@/features/quiz/theme-tallies";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";
import type { Category } from "@/types/quiz";

export interface ThemeStatsTableProps {
  groups: CategoryGroup[];
}

export const ThemeStatsTable = ({ groups }: ThemeStatsTableProps) => {
  return (
    <FastSquircleView style={styles.container}>
      <Text style={styles.title}>{STATS_TABLE_TITLE}</Text>

      <View style={styles.divider} />

      {groups.map(({ category, rows }) => (
        <View key={category.id} style={styles.group}>
          <View style={styles.row}>
            <CategoryLabel category={category} />
            <Text style={[styles.column, styles.heading]}>{STATS_GAMES_COLUMN}</Text>
            <Text style={[styles.column, styles.heading]}>{STATS_BEST_COLUMN}</Text>
            <Text style={[styles.column, styles.heading]}>{STATS_AVERAGE_COLUMN}</Text>
          </View>

          {rows.map((row) => (
            <View key={row.themeId} style={styles.row}>
              <Text style={styles.name} numberOfLines={1}>
                {row.themeName}
              </Text>
              <Text style={[styles.column, styles.statRowValue]}>{countFigure(row.gameCount)}</Text>

              <View style={styles.bestColumn}>
                <Text style={styles.statRowValue}>{scoreFigure(row.best)[0]}</Text>
                <Text style={styles.resultScoreText}>{RESULTS_SCORE_MAX_LABEL}</Text>
              </View>

              <View style={styles.bestColumn}>
                <Text style={styles.statRowValue}>{scoreFigure(row.average)[0]}</Text>
                <Text style={styles.resultScoreText}>{RESULTS_SCORE_MAX_LABEL}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </FastSquircleView>
  );
};

const CategoryLabel = ({ category }: { category: Category }) => {
  return (
    <View style={{ flex: 2 }}>
      <FastSquircleView style={[styles.categoryContainer, { backgroundColor: category.color }]}>
        <MaterialIcons name={iconNameOrFallback(category.icon)} size={16} color={COLORS.ink} />
        <Text style={styles.categoryName} numberOfLines={1}>
          {category.name}
        </Text>
      </FastSquircleView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.card, paddingVertical: SPACE.lg, borderRadius: SPACE.lg },
  title: { ...TEXT.input, color: COLORS.ink, paddingHorizontal: SPACE.lg },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.background, marginVertical: SPACE.lg },
  group: { marginTop: SPACE.md, gap: SPACE.xs, marginHorizontal: SPACE.lg },
  row: {
    flexDirection: "row",
    gap: SPACE.xs,
  },
  name: { flex: 2, ...TEXT.statTextLine, color: COLORS.ink, marginVertical: SPACE.xs },
  column: { flex: 1, textAlign: "right" },
  heading: { ...TEXT.smallText, color: COLORS.inkMuted },
  categoryContainer: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xs,
    borderRadius: SPACE.xs,
  },
  categoryName: { flexShrink: 1, ...TEXT.statCategoryStrong, textTransform: "uppercase" },
  statRowValue: {
    textAlignVertical: "center",
    alignSelf: "center",
    color: COLORS.ink,
    ...TEXT.statRowValue,
  },
  bestColumn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  resultScoreText: { marginTop: SPACE.xxs, ...TEXT.premiumLabel, color: COLORS.ink, opacity: 0.6 },
});
