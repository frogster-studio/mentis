import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import type { IconName } from "@/components/ui/icon-name";
import { POINTS_UNIT } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

// Holds « 5 pts » unwrapped — the pair measures ~40 across the two roles.
const POINTS_SLOT_WIDTH = 46;
const MODE_ICON_SIZE = 18;

export type HomeModeCardProps = {
  points: number;
  name: string;
  how: string;
  icon: IconName;
};

export function HomeModeCard({ points, name, how, icon }: HomeModeCardProps) {
  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.points}>
          {points}
          <Text style={styles.unit}> {POINTS_UNIT}</Text>
        </Text>
        <View style={styles.titleSlot}>
          <View style={styles.nameRow}>
            <MaterialIcons name={icon} size={MODE_ICON_SIZE} color={COLORS.inkMuted} />
            <Text style={styles.name}>{name}</Text>
          </View>
          <Text style={styles.how}>{how}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
  },
  points: {
    ...TEXT.statValue,
    color: COLORS.primary,
    width: POINTS_SLOT_WIDTH,
  },
  unit: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
  },
  titleSlot: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
  },
  name: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
  },
  how: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
  },
});
