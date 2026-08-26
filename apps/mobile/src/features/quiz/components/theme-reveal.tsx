import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { CategoryChip } from "@/components/category-chip";
import { ScreenContainer } from "@/components/ui/screen-container";
import { THEME_IMAGE_CACHE_POLICY } from "@/features/quiz/theme-image-cache";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, RADIUS, SPACE } from "@/theme/tokens";
import type { Category } from "@/types/quiz";

interface ThemeRevealProps {
  name: string;
  imageUrl: string;
  category: Category;
}

export function ThemeReveal({ name, imageUrl, category }: ThemeRevealProps) {
  return (
    <ScreenContainer>
      <View style={styles.stack}>
        <Image
          source={imageUrl}
          style={styles.image}
          contentFit="cover"
          cachePolicy={THEME_IMAGE_CACHE_POLICY}
          transition={200}
        />
        <View style={styles.caption}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.chipRow}>
            <CategoryChip category={category} />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACE.xl,
    paddingHorizontal: GUTTER,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: RADIUS.base,
    borderCurve: "continuous",
    backgroundColor: COLORS.quiet,
  },
  caption: { alignItems: "center", gap: SPACE.md },
  name: { ...TEXT.screenTitle, color: COLORS.ink, textAlign: "center" },
  chipRow: { flexDirection: "row" },
});
