import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { COMPETITION_TEASER, COMPETITION_TITLE } from "@/features/competition/constants";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

const TROPHY_SIZE = 24;
const CHEVRON_SIZE = 20;

export function CompetitionCard() {
  const router = useRouter();

  return (
    <Card onPress={() => router.push("/competition")}>
      <View style={styles.row}>
        <MaterialIcons name="emoji-events" size={TROPHY_SIZE} color={COLORS.primary} />
        <View style={styles.titleSlot}>
          <Text style={styles.name}>{COMPETITION_TITLE}</Text>
          <Text style={styles.teaser}>{COMPETITION_TEASER}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={CHEVRON_SIZE} color={COLORS.inkMuted} />
      </View>
    </Card>
  );
}

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
