import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { iconNameOrFallback } from "@/components/ui/icon-name";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";
import type { Category } from "@/types/quiz";

const CATEGORY_ICON_SIZE = 16;

export interface CategoryLabelProps {
  category: Category;
}

export const CategoryLabel = ({ category }: CategoryLabelProps) => {
  return (
    <FastSquircleView style={[styles.container, { backgroundColor: category.color }]}>
      <MaterialIcons
        name={iconNameOrFallback(category.icon)}
        size={CATEGORY_ICON_SIZE}
        color={COLORS.ink}
      />
      <Text style={styles.name} numberOfLines={1}>
        {category.name}
      </Text>
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xs,
    borderRadius: SPACE.xs,
  },
  name: { flexShrink: 1, ...TEXT.statCategoryStrong, textTransform: "uppercase" },
});
