import { StyleSheet, Text, View } from "react-native";
import { Squircle } from "@/components/ui/squircle";
import { RESULTS_SCORE_MAX_LABEL, RESULTS_TITLE } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const TICK_HEIGHT = 2;

export interface ResultsHeaderCardProps {
  score: number;
  themeName: string;
  outcomes: boolean[];
}

export const ResultsHeaderCard = ({ score, themeName, outcomes }: ResultsHeaderCardProps) => {
  const ticks = outcomes.map((correct, index) => ({ position: index + 1, correct }));

  return (
    <View style={styles.card}>
      <Squircle
        radius={RADIUS.xl}
        corners="top"
        color={COLORS.card}
        borderColor={null}
        borderWidth={null}
        style={styles.faceTop}
      />
      <Squircle
        radius={RADIUS.base}
        corners="bottom"
        color={COLORS.card}
        borderColor={null}
        borderWidth={null}
        style={styles.faceBottom}
      />
      <View style={styles.block}>
        <Text style={styles.title}>{RESULTS_TITLE}</Text>
        <Text style={styles.theme}>{themeName}</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.score}>{score}</Text>
          <Text style={styles.scoreMax}>{RESULTS_SCORE_MAX_LABEL}</Text>
        </View>
      </View>
      {/* Bleeds to the card edges, so the run of questions reads at a glance before any card does. */}
      <View style={styles.ticks}>
        {ticks.map((tick) => (
          <View
            key={tick.position}
            style={[
              styles.tick,
              { backgroundColor: tick.correct ? COLORS.success : COLORS.danger },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingBottom: SPACE.xl,
  },
  faceTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: RADIUS.base,
  },
  faceBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: RADIUS.base,
  },
  block: {
    alignItems: "center",
    paddingTop: SPACE.xl,
    paddingBottom: SPACE.xl,
    paddingHorizontal: SPACE.lg,
  },
  title: {
    ...TEXT.body,
    color: COLORS.ink,
  },
  theme: {
    ...TEXT.caption,
    marginTop: SPACE.lg,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: SPACE.xxs,
  },
  score: {
    ...TEXT.heroScore,
    color: COLORS.ink,
  },
  scoreMax: {
    ...TEXT.statValue,
    color: COLORS.inkMuted,
  },
  ticks: {
    flexDirection: "row",
    gap: SPACE.xs,
  },
  tick: {
    flex: 1,
    height: TICK_HEIGHT,
    borderRadius: RADIUS.round,
  },
});
