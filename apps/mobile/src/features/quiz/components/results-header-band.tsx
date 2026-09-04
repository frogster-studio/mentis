import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurBand } from "@/components/ui/blur-band";
import { RESULTS_SCORE_MAX_LABEL } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

const ROW_HEIGHT = TEXT.label.lineHeight + SPACE.md * 2;

// The band reaches under the status bar, so the swap clears the inset as well as the row.
export function useResultsBandHeight() {
  return useSafeAreaInsets().top + ROW_HEIGHT;
}

export interface ResultsHeaderBandProps {
  score: number;
  themeName: string;
}

export const ResultsHeaderBand = ({ score, themeName }: ResultsHeaderBandProps) => {
  const insets = useSafeAreaInsets();

  return (
    <BlurBand edge="top">
      <View style={[styles.row, { height: ROW_HEIGHT + insets.top, paddingTop: insets.top }]}>
        <Text style={styles.score}>
          {score}
          <Text style={styles.max}>{RESULTS_SCORE_MAX_LABEL}</Text>
        </Text>
        {/* The score holds its width and the Theme gives way, so a long name never pushes it out. */}
        <Text style={styles.theme} numberOfLines={1}>
          {themeName}
        </Text>
      </View>
    </BlurBand>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACE.md,
    paddingHorizontal: GUTTER,
  },
  score: {
    ...TEXT.label,
    color: COLORS.ink,
  },
  max: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
  },
  theme: {
    ...TEXT.label,
    flexShrink: 1,
    color: COLORS.inkMuted,
  },
});
