import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, Text, View } from "react-native";
import { COUNTDOWN_DANGER_SECONDS, COUNTDOWN_DURATION_SECONDS } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS } from "@/theme/tokens";

export interface PlayCountdownProps {
  seconds: number;
  frozen: boolean;
}

const ICON_SIZE = 14;

export const PlayCountdown = ({ seconds, frozen }: PlayCountdownProps) => {
  // Between questions the Countdown is pinned at its max and dimmed, so the ticking pause reads.
  const displaySeconds = frozen ? COUNTDOWN_DURATION_SECONDS : seconds;
  const urgent = !frozen && seconds <= COUNTDOWN_DANGER_SECONDS;
  const color = frozen ? COLORS.inkMuted : urgent ? COLORS.danger : COLORS.ink;

  return (
    <View style={styles.container}>
      <Text style={[styles.number, { color }]}>{displaySeconds}</Text>
      <MaterialCommunityIcons
        name="timer-outline"
        size={ICON_SIZE}
        color={color}
        style={styles.icon}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingRight: ICON_SIZE,
  },
  number: {
    ...TEXT.statValue,
  },
  icon: {
    position: "absolute",
    top: -2,
    right: 0,
  },
});
