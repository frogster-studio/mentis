import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { CategoryBadge } from "@/components/category-badge";
import { categoryShade, categoryWashSolid } from "@/components/category-color";
import { ALL_SCREEN_EDGES, ScreenContainer } from "@/components/ui/screen-container";
import { Squircle } from "@/components/ui/squircle";
import { THEME_IMAGE_CACHE_POLICY } from "@/features/quiz/theme-image-cache";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, RADIUS, SPACE } from "@/theme/tokens";
import type { Category } from "@/types/quiz";

const IMAGE_ASPECT_RATIO = 286 / 467;
const IMAGE_BORDER_WIDTH = 2;
// The mockup's thrown shadow: the Category's shade falling away toward the bottom right.
const SHADOW_LAYERS = [
  { x: 5, y: 7, blur: 19, alpha: 0.56 },
  { x: 19, y: 28, blur: 34, alpha: 0.48 },
  { x: 43, y: 62, blur: 45, alpha: 0.28 },
  { x: 77, y: 111, blur: 54, alpha: 0.08 },
  { x: 120, y: 173, blur: 59, alpha: 0.01 },
];

function revealShadow(color: string): string {
  return SHADOW_LAYERS.map(
    ({ x, y, blur, alpha }) => `${x}px ${y}px ${blur}px ${categoryShade(color, alpha)}`,
  ).join(", ");
}

interface ThemeRevealProps {
  name: string;
  imageUrl: string;
  category: Category;
  secondsLeft: number;
}

export const ThemeReveal = ({ name, imageUrl, category, secondsLeft }: ThemeRevealProps) => {
  return (
    <ScreenContainer
      edges={ALL_SCREEN_EDGES}
      background={categoryWashSolid(category.color)}
      underlay={null}
    >
      <View style={styles.stack}>
        <View style={styles.caption}>
          <CategoryBadge category={category} isSelected={true} />
          <Text style={styles.name}>{name}</Text>
        </View>
        <View style={[styles.frame, { boxShadow: revealShadow(category.color) }]}>
          <Image
            source={imageUrl}
            style={styles.image}
            contentFit="cover"
            cachePolicy={THEME_IMAGE_CACHE_POLICY}
            transition={200}
          />
          <Squircle
            radius={RADIUS.lg}
            borderColor={COLORS.face}
            borderWidth={IMAGE_BORDER_WIDTH}
            style={StyleSheet.absoluteFill}
            corners="all"
            color={null}
          />
          <View style={[StyleSheet.absoluteFill, styles.countLayer]}>
            <Text style={styles.count}>{secondsLeft}</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    alignItems: "center",
    gap: SPACE.xl,
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.xxl,
  },
  caption: { alignItems: "center", gap: SPACE.md },
  name: { ...TEXT.display, color: COLORS.ink, textAlign: "center" },
  frame: {
    flex: 1,
    alignSelf: "center",
    maxWidth: "100%",
    aspectRatio: IMAGE_ASPECT_RATIO,
    borderRadius: RADIUS.lg,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: COLORS.quiet,
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  countLayer: { alignItems: "center", justifyContent: "center" },
  count: { ...TEXT.revealCount, color: COLORS.face },
});
