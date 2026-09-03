import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { PlayCountdown } from "@/features/quiz/components/play-countdown";
import { remainingSeconds } from "@/features/quiz/countdown";
import { COLORS, CONTROL_ICON_SIZE, SPACE } from "@/theme/tokens";

export interface PlayHeaderProps {
  showCrown: boolean;
  endsAt: number;
  now: number;
  countdownFrozen: boolean;
  quitLabel: string;
  onQuit: () => void;
}

export const PlayHeader = ({
  showCrown,
  endsAt,
  now,
  countdownFrozen,
  quitLabel,
  onQuit,
}: PlayHeaderProps) => {
  return (
    <View style={styles.row}>
      {showCrown ? (
        <MaterialCommunityIcons
          name="crown-outline"
          size={CONTROL_ICON_SIZE}
          color={COLORS.primary}
        />
      ) : null}
      <PlayCountdown seconds={remainingSeconds(endsAt, now)} frozen={countdownFrozen} />
      <View style={styles.spacer} />
      <NewButton
        layout="hug"
        shape="full"
        tone="default"
        icon="close"
        label={null}
        accessibilityLabel={quitLabel}
        onPress={onQuit}
        disabled={false}
        pending={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.lg,
    gap: SPACE.md,
  },
  spacer: {
    flex: 1,
  },
});
