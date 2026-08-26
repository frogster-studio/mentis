import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";
import { iconNameOrFallback } from "@/components/ui/icon-name";
import { TEXT } from "@/theme/text";
import { RADIUS, SPACE } from "@/theme/tokens";
import type { Category } from "@/types/quiz";

const CHIP_ICON_SIZE = 14;

export function categoryWash(color: string): string {
  return `${color}20`;
}

export type CategoryChipProps = {
  category: Category;
};

export function CategoryChip({ category }: CategoryChipProps) {
  return (
    <View style={[styles.chip, { backgroundColor: categoryWash(category.color) }]}>
      <MaterialIcons
        name={iconNameOrFallback(category.icon)}
        size={CHIP_ICON_SIZE}
        color={category.color}
      />
      <Text style={[styles.name, { color: category.color }]} numberOfLines={1}>
        {category.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    flexShrink: 1,
    gap: SPACE.xs,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    borderRadius: RADIUS.round,
  },
  name: {
    ...TEXT.captionStrong,
    flexShrink: 1,
  },
});
