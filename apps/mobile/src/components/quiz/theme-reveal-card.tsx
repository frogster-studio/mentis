import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { THEME_IMAGE_CACHE_POLICY } from "@/features/quiz/theme-image-cache";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS } from "@/theme/tokens";

const SHADOW_LAYERS = [
  { x: 120, y: 173, blur: 59, alphaHex: "03" },
  { x: 77, y: 111, blur: 54, alphaHex: "14" },
  { x: 43, y: 62, blur: 45, alphaHex: "47" },
  { x: 19, y: 28, blur: 34, alphaHex: "7A" },
  { x: 5, y: 7, blur: 19, alphaHex: "8F" },
];

const themeRevealCardShadow = (color: string) =>
  SHADOW_LAYERS.map(
    ({ x, y, blur, alphaHex }) => `${x}px ${y}px ${blur}px ${color}${alphaHex}`,
  ).join(", ");

interface ThemeRevealCardProps {
  imageUrl: string;
  categoryColor: string;
  secondsLeft: number;
}

export const ThemeRevealCard = ({ imageUrl, categoryColor, secondsLeft }: ThemeRevealCardProps) => {
  return (
    <FastSquircleView style={[styles.card, { boxShadow: themeRevealCardShadow(categoryColor) }]}>
      <Image
        source={imageUrl}
        contentFit="cover"
        style={styles.image}
        cachePolicy={THEME_IMAGE_CACHE_POLICY}
        transition={200}
      />

      <View style={styles.countLayer}>
        <Text style={styles.count}>{secondsLeft}</Text>
      </View>
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderColor: COLORS.face,
    borderWidth: 2,
    width: "75%",
    aspectRatio: 3 / 5,
    overflow: "hidden",
  },
  image: { flex: 1 },
  countLayer: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  count: { ...TEXT.revealCount, color: COLORS.face },
});
