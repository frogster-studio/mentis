import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { CategoryChip, categoryWash } from "@/components/category-chip";
import { ScreenContainer } from "@/components/ui/screen-container";
import { THEME_IMAGE_CACHE_POLICY } from "@/features/quiz/theme-image-cache";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, RADIUS, SHADOW, SPACE } from "@/theme/tokens";
import type { Category } from "@/types/quiz";

const IMAGE_ASPECT_RATIO = 0.62;

interface ThemeRevealProps {
  name: string;
  imageUrl: string;
  category: Category;
  secondsLeft: number;
}

export function ThemeReveal({ name, imageUrl, category, secondsLeft }: ThemeRevealProps) {
  return (
    <ScreenContainer background={categoryWash(category.color)}>
      <View style={styles.stack}>
        <View style={styles.caption}>
          <View style={styles.chipRow}>
            <CategoryChip category={category} />
          </View>
          <Text style={styles.name}>{name}</Text>
        </View>
        <View style={styles.frame}>
          <Image
            source={imageUrl}
            style={styles.image}
            contentFit="cover"
            cachePolicy={THEME_IMAGE_CACHE_POLICY}
            transition={200}
          />
          <View style={[StyleSheet.absoluteFill, styles.countLayer]}>
            <Text style={styles.count}>{secondsLeft}</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    alignItems: "center",
    gap: SPACE.xl,
    paddingHorizontal: GUTTER,
    paddingVertical: SPACE.xxl,
  },
  caption: { alignItems: "center", gap: SPACE.md },
  chipRow: { flexDirection: "row" },
  name: { ...TEXT.revealTitle, color: COLORS.ink, textAlign: "center" },
  frame: {
    flex: 1,
    alignSelf: "center",
    maxWidth: "100%",
    aspectRatio: IMAGE_ASPECT_RATIO,
  },
  image: {
    flex: 1,
    borderRadius: RADIUS.base,
    borderCurve: "continuous",
    backgroundColor: COLORS.quiet,
    boxShadow: SHADOW.card,
  },
  countLayer: { alignItems: "center", justifyContent: "center" },
  count: { ...TEXT.revealCount, color: COLORS.card },
});
