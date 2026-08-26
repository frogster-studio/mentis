import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { CountdownRing } from "@/features/quiz/components/countdown-ring";
import { remainingFraction, remainingSeconds } from "@/features/quiz/countdown";
import { COLORS, CONTROL_ICON_SIZE, SPACE } from "@/theme/tokens";

export type PlayHeaderProps = {
  showCrown: boolean;
  endsAt: number;
  now: number;
  quitLabel: string;
  onQuit: () => void;
};

export function PlayHeader({ showCrown, endsAt, now, quitLabel, onQuit }: PlayHeaderProps) {
  return (
    <View style={styles.row}>
      {showCrown ? (
        <MaterialCommunityIcons
          name="crown-outline"
          size={CONTROL_ICON_SIZE}
          color={COLORS.primary}
        />
      ) : null}
      <View style={styles.right}>
        <CountdownRing
          fraction={remainingFraction(endsAt, now)}
          seconds={remainingSeconds(endsAt, now)}
        />
        <NewButton layout="hug" icon="close" accessibilityLabel={quitLabel} onPress={onQuit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.lg,
  },
  right: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
  },
});
