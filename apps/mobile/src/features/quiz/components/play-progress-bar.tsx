import { StyleSheet, View } from "react-native";
import { COLORS, SPACE } from "@/theme/tokens";

const SEGMENT_HEIGHT = 2;

interface PlayProgressBarProps {
  position: number;
  total: number;
}

export const PlayProgressBar = ({ position, total }: PlayProgressBarProps) => {
  const steps = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <View style={styles.row}>
      {steps.map((step) => (
        <View
          key={step}
          style={[
            styles.segment,
            step < position && styles.segmentPast,
            step === position && styles.segmentCurrent,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: SPACE.xs,
  },
  segment: {
    flex: 1,
    height: SEGMENT_HEIGHT,
    backgroundColor: COLORS.divider,
  },
  segmentPast: {
    backgroundColor: COLORS.inkMuted,
  },
  segmentCurrent: {
    backgroundColor: COLORS.ink,
  },
});
