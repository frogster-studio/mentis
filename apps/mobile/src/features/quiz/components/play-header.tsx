import { StyleSheet, Text, View } from "react-native";
import { QuietButton } from "@/components/ui/quiet-button";
import { CountdownRing } from "@/features/quiz/components/countdown-ring";
import { remainingFraction, remainingSeconds } from "@/features/quiz/countdown";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

export type PlayHeaderProps = {
  position: number;
  total: number;
  endsAt: number;
  now: number;
  quitLabel: string;
  onQuit: () => void;
};

export function PlayHeader({ position, total, endsAt, now, quitLabel, onQuit }: PlayHeaderProps) {
  return (
    <View style={styles.header}>
      <QuietButton layout="circle" icon="close" accessibilityLabel={quitLabel} onPress={onQuit} />
      <View style={styles.headerRight}>
        <Text style={styles.progress}>
          {position}
          <Text style={styles.progressTotal}>/{total}</Text>
        </Text>
        <CountdownRing
          fraction={remainingFraction(endsAt, now)}
          seconds={remainingSeconds(endsAt, now)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
  },
  progress: {
    ...TEXT.label,
    color: COLORS.primary,
  },
  progressTotal: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
  },
});
