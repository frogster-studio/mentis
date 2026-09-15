import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Squircle } from "@/components/ui/squircle";
import {
  SESSION_DAYS_LABEL,
  SESSION_END_LABEL,
  SESSION_HOURS_LABEL,
  SESSION_LABEL,
  SESSION_MINUTES_LABEL,
} from "@/features/world/constants";
import { monthTimeLeft, sessionNumber } from "@/features/world/season-calendar";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const REFRESH_MS = 60000;

export const SeasonSummary = () => {
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      const interval = setInterval(() => setNow(new Date()), REFRESH_MS);
      return () => clearInterval(interval);
    }, []),
  );
  const remaining = monthTimeLeft(now);

  return (
    <View style={styles.row}>
      <Squircle
        radius={RADIUS.sm}
        corners="all"
        color={COLORS.background}
        borderColor={null}
        borderWidth={null}
        style={styles.badge}
      >
        <Text style={styles.label}>
          {SESSION_LABEL} <Text style={styles.strong}>#{sessionNumber(now)}</Text>
        </Text>
      </Squircle>
      <Squircle
        radius={RADIUS.sm}
        corners="all"
        color={COLORS.background}
        borderColor={null}
        borderWidth={null}
        style={styles.badge}
      >
        <MaterialCommunityIcons
          name="timer-sand"
          size={TEXT.caption.fontSize}
          color={COLORS.inkMuted}
        />
        <Text style={styles.label}>
          {SESSION_END_LABEL}{" "}
          <Text style={styles.strong}>
            {remaining.days > 0
              ? `${remaining.days} ${SESSION_DAYS_LABEL} ${remaining.hours} ${SESSION_HOURS_LABEL}`
              : `${remaining.hours} ${SESSION_HOURS_LABEL} ${remaining.minutes} ${SESSION_MINUTES_LABEL}`}
          </Text>
        </Text>
      </Squircle>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: SPACE.xs,
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.xl,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.xs,
    paddingHorizontal: SPACE.xs,
    paddingVertical: SPACE.xxs,
  },
  label: { ...TEXT.caption, color: COLORS.ink },
  strong: TEXT.captionStrong,
});
