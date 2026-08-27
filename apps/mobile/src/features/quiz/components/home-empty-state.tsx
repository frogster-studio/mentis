import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";
import { CountdownRing } from "@/features/quiz/components/countdown-ring";
import { HomeModeCard } from "@/features/quiz/components/home-mode-card";
import {
  CASH_MODE_HOW,
  CASH_MODE_NAME,
  COUNTDOWN_DURATION_SECONDS,
  HOME_EMPTY_OUTCOME,
  HOME_EMPTY_SETUP,
  HOME_EMPTY_SWITCH,
  HOME_EMPTY_TITLE,
  POINTS_CASH,
  POINTS_SQUARE,
  SQUARE_MODE_HOW,
  SQUARE_MODE_NAME,
} from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

// A running arc reads as a timer; a full circle reads as a badge.
const RING_PREVIEW_FRACTION = 0.75;
const SWITCH_ICON_SIZE = 20;

export const HomeEmptyState = () => {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{HOME_EMPTY_TITLE}</Text>
      <View style={styles.setup}>
        <CountdownRing fraction={RING_PREVIEW_FRACTION} seconds={COUNTDOWN_DURATION_SECONDS} />
        <Text style={styles.setupText}>{HOME_EMPTY_SETUP}</Text>
      </View>
      <HomeModeCard points={POINTS_CASH} name={CASH_MODE_NAME} how={CASH_MODE_HOW} icon="edit" />
      <View style={styles.switchRow}>
        <MaterialIcons name="arrow-downward" size={SWITCH_ICON_SIZE} color={COLORS.inkMuted} />
        <Text style={styles.switchText}>{HOME_EMPTY_SWITCH}</Text>
      </View>
      <HomeModeCard
        points={POINTS_SQUARE}
        name={SQUARE_MODE_NAME}
        how={SQUARE_MODE_HOW}
        icon="grid-view"
      />
      <Text style={styles.outcome}>{HOME_EMPTY_OUTCOME}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    gap: SPACE.lg,
  },
  title: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
    textAlign: "center",
  },
  setup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.md,
  },
  setupText: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.sm,
  },
  switchText: {
    ...TEXT.captionStrong,
    color: COLORS.inkMuted,
  },
  outcome: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
});
