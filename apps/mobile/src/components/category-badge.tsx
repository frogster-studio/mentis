import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SquircleView } from "expo-squircle-view";
import { StyleSheet } from "react-native";
import { iconNameOrFallback } from "@/components/ui/icon-name";
import { COLORS, CONTROL_ICON_SIZE } from "@/theme/tokens";
import type { Category } from "@/types/quiz";

export const CATEGORY_BADGE_SIZE = 42;
export const CATEGORY_BADGE_RADIUS = 14;

export interface CategoryBadgeProps {
  category: Category;
  isSelected: boolean;
}

export const CategoryBadge = ({ category, isSelected }: CategoryBadgeProps) => {
  return (
    <SquircleView
      borderRadius={CATEGORY_BADGE_RADIUS}
      style={[styles.badge, { backgroundColor: isSelected ? COLORS.face : category.color }]}
    >
      <MaterialIcons
        name={iconNameOrFallback(category.icon)}
        size={CONTROL_ICON_SIZE}
        color={COLORS.ink}
      />
    </SquircleView>
  );
};

const styles = StyleSheet.create({
  badge: {
    width: CATEGORY_BADGE_SIZE,
    height: CATEGORY_BADGE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    backgroundColor: COLORS.card,
  },
});
