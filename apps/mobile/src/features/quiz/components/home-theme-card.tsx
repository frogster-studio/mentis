import { StyleSheet, Text, View } from "react-native";
import { MAX_SESSION_SCORE } from "@/features/quiz/constants";
import { formatAverage } from "@/features/quiz/stats";
import { COLORS, RADIUS } from "@/theme/tokens";

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
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.stroke,
    backgroundColor: COLORS.quiet,
    paddingVertical: 16,
    paddingHorizontal: 14,
    justifyContent: "space-between",
    gap: 8,
  },
  value: {
    color: COLORS.ink,
    fontSize: 30,
    fontWeight: "bold",
  },
  max: {
    color: COLORS.inkMuted,
    fontSize: 16,
    fontWeight: "bold",
  },
  name: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: "bold",
  },
});
