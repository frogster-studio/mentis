import { StyleSheet, Text, View } from "react-native";
import { CategoryChip } from "@/components/category-chip";
import { Card } from "@/components/ui/card";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";
import type { Category } from "@/types/quiz";

export type ThemeCardProps = {
  name: string;
  category: Category;
  onPress: () => void;
};

export function ThemeCard({ name, category, onPress }: ThemeCardProps) {
  return (
    <Card onPress={onPress}>
      <View style={styles.stack}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <CategoryChip category={category} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: {
    alignItems: "center",
    gap: SPACE.sm,
  },
  name: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
    textAlign: "center",
    alignSelf: "stretch",
  },
});
