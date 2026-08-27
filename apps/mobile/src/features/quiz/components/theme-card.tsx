import { SquircleButton } from "expo-squircle-view";
import { Animated, StyleSheet } from "react-native";
import { CategoryBadge } from "@/components/category-badge";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, RADIUS, SPACE } from "@/theme/tokens";
import type { Category } from "@/types/quiz";

export interface ThemeCardProps {
  name: string;
  color: string;
  category: Category;
  isSelected: boolean;
  noSelection: boolean;
  onPress: () => void;
}

export const ThemeCard = ({
  name,
  color,
  category,
  isSelected,
  noSelection,
  onPress,
}: ThemeCardProps) => {
  return (
    <SquircleButton
      borderRadius={RADIUS.base}
      onPress={onPress}
      style={[
        styles.row,
        isSelected && { backgroundColor: color },
        !isSelected && !noSelection && { opacity: 0.6 },
      ]}
      activeOpacity={PRESSED.opacity}
    >
      <CategoryBadge category={category} isSelected={isSelected} />
      <Animated.Text style={[styles.name]} numberOfLines={1}>
        {name}
      </Animated.Text>
    </SquircleButton>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    backgroundColor: COLORS.card,
    padding: SPACE.xs,
  },
  name: { ...TEXT.rowTitle, flex: 1 },
  pressed: PRESSED,
});
