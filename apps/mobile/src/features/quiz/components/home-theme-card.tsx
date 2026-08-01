import { StyleSheet, Text, View } from "react-native";
import { MAX_SESSION_SCORE } from "@/features/quiz/constants";
import { formatAverage } from "@/features/quiz/stats";
import { COLORS } from "@/utils/colors";

// A single home shelf card for a played Theme: its Theme Average out of 50 (French
// formatting) over the Theme name captured when the session was recorded.
export type HomeThemeCardProps = {
  name: string;
  average: number;
};

export function HomeThemeCard({ name, average }: HomeThemeCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>
        {formatAverage(average)}
        <Text style={styles.max}> / {MAX_SESSION_SCORE}</Text>
      </Text>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 128,
    minHeight: 104,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.strokeDefault,
    backgroundColor: COLORS.panel,
    paddingVertical: 16,
    paddingHorizontal: 14,
    justifyContent: "space-between",
    gap: 8,
  },
  value: {
    color: COLORS.fill,
    fontSize: 30,
    fontWeight: "bold",
  },
  max: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: "bold",
  },
  name: {
    color: COLORS.fill,
    fontSize: 14,
    fontWeight: "bold",
  },
});
