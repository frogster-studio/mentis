import { StyleSheet, Text, View } from "react-native";
import { CategoryBadge } from "@/components/category-badge";
import { ThemeRevealCard } from "@/components/quiz/theme-reveal-card";
import { ALL_SCREEN_EDGES, ScreenContainer } from "@/components/ui/screen-container";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";
import type { Category } from "@/types/quiz";

interface ThemeRevealProps {
  name: string;
  imageUrl: string;
  category: Category;
  secondsLeft: number;
}

export const ThemeReveal = ({ name, imageUrl, category, secondsLeft }: ThemeRevealProps) => {
  return (
    <ScreenContainer edges={ALL_SCREEN_EDGES} backdropColor={`${category.color}40`}>
      <View style={styles.stack}>
        <View style={styles.caption}>
          <CategoryBadge category={category} isSelected={false} />
          <Text style={styles.name}>{name}</Text>
        </View>

        <ThemeRevealCard
          imageUrl={imageUrl}
          categoryColor={category.color}
          secondsLeft={secondsLeft}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.xl,
    paddingHorizontal: GUTTER,
    paddingBottom: SPACE.lg,
  },
  caption: { alignItems: "center", gap: SPACE.md },
  name: { ...TEXT.revealTitle, color: COLORS.ink, textAlign: "center" },
});
