import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { CategoryPill } from "@/components/category-pill";
import type { IconName } from "@/components/ui/icon-name";
import {
  HERO_FACE,
  HERO_OVERLAY_SHADOW,
  OnboardingHeroFrame,
} from "@/features/onboarding/components/onboarding-hero-frame";

const QUESTION_CARD = require("../../../../assets/images/onboarding/question-card.webp");
const BALL = require("../../../../assets/images/onboarding/ball.webp");
const STATUE = require("../../../../assets/images/onboarding/statue.webp");
const MOUNTAINS = require("../../../../assets/images/onboarding/mountains.webp");

// Sample Categories for the walkthrough alone, so their colours are theirs and not roles.
const SCATTERED_PILLS = [
  {
    name: "Musique",
    icon: "music-note",
    color: "#eba3ff",
    left: "2.8%",
    top: "53.2%",
    rotate: "5.12deg",
  },
  {
    name: "Histoire",
    icon: "history-edu",
    color: "#ffe3a0",
    left: "47.7%",
    top: "39%",
    rotate: "1.81deg",
  },
  {
    name: "Sciences",
    icon: "science",
    color: "#8caaff",
    left: "66%",
    top: "60.7%",
    rotate: "-7.8deg",
  },
  { name: "Nature", icon: "park", color: "#83d3af", left: "5.2%", top: "74.9%", rotate: "1.5deg" },
  {
    name: "Sport",
    icon: "sports-soccer",
    color: "#ffaa82",
    left: "69%",
    top: "78.2%",
    rotate: "5.65deg",
  },
  {
    name: "Géographie",
    icon: "map",
    color: "#8ad0ff",
    left: "33.3%",
    top: "91%",
    rotate: "-1.51deg",
  },
] as const satisfies readonly {
  name: string;
  icon: IconName;
  color: string;
  left: string;
  top: string;
  rotate: string;
}[];

export const PracticeHero = () => {
  return (
    <OnboardingHeroFrame>
      {/* The card peeks over the top edge yet sits under the statue, so it stays out of the clip. */}
      <View style={HERO_OVERLAY_SHADOW}>
        <Image source={QUESTION_CARD} contentFit="contain" style={styles.questionCard} />
      </View>
      <FastSquircleView style={HERO_FACE}>
        <Image source={BALL} contentFit="contain" style={styles.ball} />
        <Image source={STATUE} contentFit="contain" style={styles.statue} />
        <Image source={MOUNTAINS} contentFit="contain" style={styles.mountains} />
        {SCATTERED_PILLS.map((pill) => (
          <View
            key={pill.name}
            style={[
              styles.pill,
              { left: pill.left, top: pill.top, transform: [{ rotate: pill.rotate }] },
            ]}
          >
            <CategoryPill icon={pill.icon} color={pill.color} label={pill.name} />
          </View>
        ))}
      </FastSquircleView>
    </OnboardingHeroFrame>
  );
};

const styles = StyleSheet.create({
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
