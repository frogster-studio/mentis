import { Image } from "expo-image";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { CategoryPill } from "@/components/category-pill";
import { LogoWordmark } from "@/components/logo-wordmark";
import type { CommunityIconName } from "@/components/ui/icon-name";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { Squircle } from "@/components/ui/squircle";
import { SIGN_IN_TITLE } from "@/features/account/constants";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

const HERO = require("../../../../assets/images/sign-in-hero.jpg");

const HERO_HEIGHT = 649;

// The scatter is measured off the mockup, so each pill keeps its own drift and tilt.
const SCATTERED_PILLS = [
  { icon: "palette-outline", left: "66%", top: "43%", rotate: "-4.1deg" },
  { icon: "pine-tree-variant-outline", left: "21%", top: "51%", rotate: "5.88deg" },
  { icon: "soccer", left: "15%", top: "68%", rotate: "-3.73deg" },
  { icon: "earth", left: "64%", top: "72%", rotate: "7.3deg" },
] as const satisfies readonly {
  icon: CommunityIconName;
  left: string;
  top: string;
  rotate: string;
}[];

export const SignInHero = () => {
  const { width } = useWindowDimensions();
  const heroWidth = Math.min(width, MAX_CONTENT_WIDTH) - GUTTER * 2;

  return (
    <Squircle
      radius={RADIUS.xl}
      corners="all"
      color={COLORS.ink}
      borderColor={null}
      borderWidth={null}
      style={styles.hero}
    >
      <Image source={HERO} style={StyleSheet.absoluteFill} contentFit="cover" />
      <Text style={styles.title}>{SIGN_IN_TITLE}</Text>
      {SCATTERED_PILLS.map((pill) => (
        <View
          key={pill.icon}
          style={[
            styles.pill,
            { left: pill.left, top: pill.top, transform: [{ rotate: pill.rotate }] },
          ]}
        >
          <CategoryPill icon={pill.icon} />
        </View>
      ))}
      <View style={styles.wordmark}>
        <LogoWordmark color={COLORS.face} width={heroWidth - SPACE.xl * 2} />
      </View>
    </Squircle>
  );
};

const styles = StyleSheet.create({
  hero: {
    height: HERO_HEIGHT,
    flexShrink: 1,
  },
  title: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: SPACE.xl,
  },
  pill: {
    position: "absolute",
  },
  wordmark: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: SPACE.md,
    alignItems: "center",
  },
});
