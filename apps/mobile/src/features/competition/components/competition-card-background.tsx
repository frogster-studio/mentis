import { Image, type ImageSource } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { THEME_IMAGE_CACHE_POLICY } from "@/features/quiz/theme-image-cache";
import { RADIUS } from "@/theme/tokens";
import { gradient } from "@/utils/gradient";

const THEME_IMAGE_OPACITY = 0.13;

export interface CompetitionCardBackgroundProps {
  colors: string[];
  isFinished: boolean;
  themeImage: ImageSource | null;
  isFrozen: boolean;
}

export const CompetitionCardBackground = ({
  colors,
  isFinished,
  themeImage,
  isFrozen,
}: CompetitionCardBackgroundProps) => {
  const center = colors[0];
  const edge = colors[1] ?? colors[0];

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.surface,
        edge === undefined
          ? { backgroundColor: center }
          : gradient(`radial-gradient(farthest-corner at 50% 100%, ${center}, ${edge})`),
      ]}
      pointerEvents="none"
    >
      {!isFinished ? null : themeImage === null ? (
        <Skeleton
          radius={RADIUS.base}
          isOnDark={false}
          isFrozen={isFrozen}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <Image
          source={themeImage}
          contentFit="cover"
          cachePolicy={THEME_IMAGE_CACHE_POLICY}
          style={styles.themeImage}
          accessible={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  surface: { borderRadius: RADIUS.base, borderCurve: "continuous", overflow: "hidden" },
  themeImage: { position: "absolute", inset: 0, opacity: THEME_IMAGE_OPACITY },
});
