import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import type { IconName } from "@/components/ui/icon-name";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

const ICON_SIZE = 24;
const CHEVRON_SIZE = 20;

export interface CompetitionCardProps {
  title: string;
  teaser: string;
  icon: IconName;
  onPress: () => void;
}

export const CompetitionCard = ({ title, teaser, icon, onPress }: CompetitionCardProps) => {
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <MaterialIcons name={icon} size={ICON_SIZE} color={COLORS.primary} />
        <View style={styles.titleSlot}>
          <Text style={styles.name}>{title}</Text>
          <Text style={styles.teaser}>{teaser}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={CHEVRON_SIZE} color={COLORS.inkMuted} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
  },
  titleSlot: {
    flex: 1,
  },
  name: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
  },
  teaser: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
  },
});
