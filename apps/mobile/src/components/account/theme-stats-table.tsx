import { StyleSheet, Text, View } from "react-native";
import { CategoryPill } from "@/components/category-pill";
import { Card } from "@/components/ui/card";
import { iconNameOrFallback } from "@/components/ui/icon-name";
import {
  STATS_AVERAGE_COLUMN,
  STATS_BEST_COLUMN,
  STATS_GAMES_COLUMN,
  STATS_TABLE_TITLE,
} from "@/features/account/constants";
import { countFigure, scoreFigure } from "@/features/account/stat-figures";
import type { CategoryGroup } from "@/features/quiz/theme-tallies";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

export interface ThemeStatsTableProps {
  groups: CategoryGroup[];
}

export const ThemeStatsTable = ({ groups }: ThemeStatsTableProps) => {
  return (
    <Card background={null} onPress={null}>
      <Text style={styles.title}>{STATS_TABLE_TITLE}</Text>
      <View style={styles.row}>
        <View style={styles.name} />
        <Text style={[styles.column, styles.heading]}>{STATS_GAMES_COLUMN}</Text>
        <Text style={[styles.column, styles.heading]}>{STATS_BEST_COLUMN}</Text>
        <Text style={[styles.column, styles.heading]}>{STATS_AVERAGE_COLUMN}</Text>
      </View>
      {groups.map(({ category, rows }) => (
        <View key={category.id} style={styles.group}>
          <CategoryPill
            icon={iconNameOrFallback(category.icon)}
            iconBg={category.color}
            color={category.secondaryColor}
            label={category.name}
          />
          {rows.map((row) => (
            <View key={row.themeId} style={styles.row}>
              <Text style={[styles.name, styles.cell]} numberOfLines={1}>
                {row.themeName}
              </Text>
              <Text style={[styles.column, styles.cell]}>{countFigure(row.gameCount)}</Text>
              <Text style={[styles.column, styles.cell]}>{scoreFigure(row.best)}</Text>
              <Text style={[styles.column, styles.cell]}>{scoreFigure(row.average)}</Text>
            </View>
          ))}
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  title: { ...TEXT.cardTitle, color: COLORS.ink },
  group: { marginTop: SPACE.md, gap: SPACE.xs },
  row: { flexDirection: "row", alignItems: "center", gap: SPACE.xs },
  name: { flex: 2 },
  column: { flex: 1, textAlign: "center" },
  heading: { ...TEXT.smallText, color: COLORS.inkMuted },
  cell: { ...TEXT.caption, color: COLORS.ink },
});
