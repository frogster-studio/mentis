import { Image, type ImageSource } from "expo-image";
import { StyleSheet, View } from "react-native";
import { THEME_IMAGE_CACHE_POLICY } from "@/features/quiz/theme-image-cache";
import { RADIUS } from "@/theme/tokens";
import { gradient } from "@/utils/gradient";

const LANDSCAPE_IMAGE = require("../../../../assets/images/competition/landscape.png");
const LANDSCAPE_OPACITY = 0.13;

export interface CompetitionCardBackgroundProps {
  colors: string[];
  isFinished: boolean;
  themeImage?: ImageSource | number;
}

export const CompetitionCardBackground = ({
  colors,
  isFinished,
  themeImage,
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
      {isFinished ? (
        <Image
          source={themeImage ?? LANDSCAPE_IMAGE}
          contentFit="cover"
          cachePolicy={THEME_IMAGE_CACHE_POLICY}
          style={styles.landscape}
          accessible={false}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  surface: { borderRadius: RADIUS.base, borderCurve: "continuous", overflow: "hidden" },
  landscape: { position: "absolute", inset: 0, opacity: LANDSCAPE_OPACITY },
});
