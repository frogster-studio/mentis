import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SquircleView } from "expo-squircle-view";
import { StyleSheet } from "react-native";
import { iconNameOrFallback } from "@/components/ui/icon-name";
import { COLORS, CONTROL_ICON_SIZE } from "@/theme/tokens";
import type { Category } from "@/types/quiz";

export interface CategoryBadgeProps {
  category: Category;
  isSelected: boolean;
}

export const CategoryBadge = ({ category, isSelected }: CategoryBadgeProps) => {
  return (
    <SquircleView borderRadius={14} style={[styles.badge, isSelected && styles.selected]}>
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
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    backgroundColor: COLORS.card,
  },
});
