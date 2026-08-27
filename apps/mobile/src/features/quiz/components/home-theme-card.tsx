import { StyleSheet, Text, View } from "react-native";
import { CategoryChip } from "@/components/category-chip";
import { Card } from "@/components/ui/card";
import { MAX_SESSION_SCORE } from "@/features/quiz/constants";
import { formatAverage, formatSessionCount } from "@/features/quiz/stats";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";
import type { Category } from "@/types/quiz";

// Holds the widest run « 37,5/50 » unwrapped, so every title starts on the same column.
const STAT_SLOT_WIDTH = 82;

export type HomeThemeCardProps = {
  name: string;
  average: number;
  sessionCount: number;
  category?: Category;
};

export function HomeThemeCard({ name, average, sessionCount, category }: HomeThemeCardProps) {
  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.value}>
          {formatAverage(average)}
          <Text style={styles.max}>/{MAX_SESSION_SCORE}</Text>
        </Text>
        <View style={styles.titleSlot}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.meta}>
            {category ? <CategoryChip category={category} /> : null}
            <Text style={styles.sessions}>{formatSessionCount(sessionCount)}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
  },
  value: {
    ...TEXT.statValue,
    color: COLORS.primary,
    width: STAT_SLOT_WIDTH,
  },
  max: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
  },
  titleSlot: {
    flex: 1,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
  },
  name: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
  },
  sessions: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
  },
});
