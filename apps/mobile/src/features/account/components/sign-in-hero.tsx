import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { CategoryPill } from "@/components/category-pill";
import type { CommunityIconName } from "@/components/ui/icon-name";
import { SIGN_IN_TITLE, SIGN_IN_WORDMARK } from "@/features/account/constants";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const HERO = require("../../../../assets/images/sign-in-hero.jpg");

const HERO_HEIGHT = 649;
// The word's line box hangs below the card so its baseline lands near the bottom edge, as mocked.
const WORDMARK_OVERHANG = 95;

// The scatter is measured off the mockup, so each pill keeps its own drift and tilt.
const SCATTERED_PILLS = [
  { icon: "palette-outline", left: "66%", top: "43%", rotate: "-4.1deg", color: COLORS.danger },
  {
    icon: "pine-tree-variant-outline",
    left: "21%",
    top: "51%",
    rotate: "5.88deg",
    color: COLORS.primary,
  },
  { icon: "soccer", left: "15%", top: "68%", rotate: "-3.73deg", color: COLORS.neutral },
  { icon: "earth", left: "64%", top: "72%", rotate: "7.3deg", color: COLORS.success },
] as const satisfies readonly {
  icon: CommunityIconName;
  left: string;
  top: string;
  rotate: string;
  color: string;
}[];

export const SignInHero = () => {
  return (
    <View style={styles.hero}>
      {/* Image + Mentis */}
      <FastSquircleView
        style={{
          overflow: "hidden",
          borderRadius: RADIUS.base,
          borderTopLeftRadius: RADIUS.xl,
          borderTopRightRadius: RADIUS.xl,
        }}
      >
        <Text style={styles.title}>{SIGN_IN_TITLE}</Text>

        <Text style={styles.wordmark} numberOfLines={1}>
          {SIGN_IN_WORDMARK}
        </Text>

        <Image source={HERO} style={{ width: "100%", height: "100%" }} contentFit="cover" />
      </FastSquircleView>

      {SCATTERED_PILLS.map((pill) => (
        <View
          key={pill.icon}
          style={[
            styles.pill,
            { left: pill.left, top: pill.top, transform: [{ rotate: pill.rotate }] },
          ]}
        >
          <CategoryPill icon={pill.icon} color={pill.color} />
        </View>
      ))}
      <View style={styles.wordmarkSlot}></View>
    </View>
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
    position: "absolute",
    zIndex: 1,
    top: 0,
    alignSelf: "center",
  },
  pill: {
    position: "absolute",
  },
  wordmarkSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -WORDMARK_OVERHANG,
    alignItems: "center",
  },
  wordmark: {
    ...TEXT.display,
    position: "absolute",
    alignSelf: "center",
    zIndex: 1,
    bottom: 0,
    color: COLORS.face,
  },
});
