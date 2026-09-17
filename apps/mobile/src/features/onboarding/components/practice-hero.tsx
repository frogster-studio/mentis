import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { CategoryPill } from "@/components/category-pill";
import type { CommunityIconName } from "@/components/ui/icon-name";
import { COLORS, RADIUS } from "@/theme/tokens";

const QUESTION_CARD = require("../../../../assets/images/onboarding/question-card.png");
const BALL = require("../../../../assets/images/onboarding/ball.png");
const STATUE = require("../../../../assets/images/onboarding/statue.png");
const MOUNTAINS = require("../../../../assets/images/onboarding/mountains.png");

// The card keeps the mockup's proportions, so every piece sits at its measured fraction of it.
const HERO_ASPECT_RATIO = 410 / 461;

// The scatter is measured off the mockup, so each pill keeps its own drift and tilt.
const SCATTERED_PILLS = [
  { icon: "palette-outline", left: "2.8%", top: "53.2%", rotate: "5.12deg", color: COLORS.danger },
  { icon: "feather", left: "47.7%", top: "39%", rotate: "1.81deg", color: COLORS.primarySunken },
  { icon: "flask-outline", left: "66%", top: "60.7%", rotate: "-7.8deg", color: COLORS.catchup },
  {
    icon: "pine-tree-variant-outline",
    left: "5.2%",
    top: "74.9%",
    rotate: "1.5deg",
    color: COLORS.success,
  },
  { icon: "soccer", left: "69%", top: "78.2%", rotate: "5.65deg", color: COLORS.neutral },
  { icon: "earth", left: "33.3%", top: "91%", rotate: "-1.51deg", color: COLORS.ink },
] as const satisfies readonly {
  icon: CommunityIconName;
  left: string;
  top: string;
  rotate: string;
  color: string;
}[];

export const PracticeHero = () => {
  return (
    <View style={styles.hero} pointerEvents="none" accessible={false}>
      <FastSquircleView style={[styles.face, styles.paint]} />
      {/* The card peeks over the top edge yet sits under the statue, so it lives outside the clip. */}
      <Image source={QUESTION_CARD} contentFit="contain" style={styles.questionCard} />
      <FastSquircleView style={[styles.face, styles.clip]}>
        <Image source={BALL} contentFit="contain" style={styles.ball} />
        <Image source={STATUE} contentFit="contain" style={styles.statue} />
        <Image source={MOUNTAINS} contentFit="contain" style={styles.mountains} />
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
      </FastSquircleView>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    aspectRatio: HERO_ASPECT_RATIO,
  },
  face: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS.base,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  paint: {
    backgroundColor: COLORS.primary,
  },
  clip: {
    overflow: "hidden",
  },
  questionCard: {
    position: "absolute",
    left: "17.3%",
    top: "-2.2%",
    width: "65.4%",
    aspectRatio: 268 / 170.5,
  },
  ball: {
    position: "absolute",
    left: "76.8%",
    top: "62.7%",
    width: "27.8%",
    aspectRatio: 114 / 113,
  },
  statue: {
    position: "absolute",
    left: "20.7%",
    top: "23.6%",
    width: "54.6%",
    aspectRatio: 224 / 372,
  },
  mountains: {
    position: "absolute",
    left: "-14.9%",
    top: "61.8%",
    width: "47.3%",
    aspectRatio: 194 / 155,
  },
  pill: {
    position: "absolute",
  },
});
