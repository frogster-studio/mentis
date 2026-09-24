import { Image } from "expo-image";
import { View } from "react-native";
import Animated, { css as StyleSheetReanimated } from "react-native-reanimated";
import { CategoryPill } from "@/components/category-pill";
import type { IconName } from "@/components/ui/icon-name";
import { OnboardingHeroFrame } from "@/features/onboarding/components/onboarding-hero-frame";
import { OnboardingQuestionCard } from "@/features/onboarding/components/onboarding-question-card";

const AnimatedImage = Animated.createAnimatedComponent(Image);

const BALL = require("../../../../assets/images/onboarding/ball.webp");
const STATUE = require("../../../../assets/images/onboarding/statue.webp");
const MOUNTAINS = require("../../../../assets/images/onboarding/mountains.webp");

const SCATTERED_PILLS = [
  {
    name: "Musique",
    icon: "music-note",
    color: "#B7A3E9",
    sColor: "#DCD7E9",
    left: "2.8%",
    top: "53.2%",
    rotate: "5.12deg",
  },
  {
    name: "Histoire",
    icon: "history-edu",
    color: "#FFE3A0",
    sColor: "#FFF6E2",
    left: "47.7%",
    top: "39%",
    rotate: "1.81deg",
  },
  {
    name: "Sciences",
    icon: "science",
    color: "#8CAAFF",
    sColor: "#E0E8FF",
    left: "66%",
    top: "60.7%",
    rotate: "-7.8deg",
  },
  {
    name: "Nature",
    icon: "park",
    color: "#83D3AF",
    sColor: "#BDEDD7",
    left: "5.2%",
    top: "74.9%",
    rotate: "1.5deg",
  },
  {
    name: "Sport",
    icon: "sports-soccer",
    color: "#FFAA82",
    sColor: "#FFE4D7",
    left: "69%",
    top: "78.2%",
    rotate: "5.65deg",
  },
  {
    name: "Géographie",
    icon: "map",
    color: "#8AD0FF",
    sColor: "#DAF0FF",
    left: "33.3%",
    top: "91%",
    rotate: "-1.51deg",
  },
] as const satisfies readonly {
  name: string;
  icon: IconName;
  color: string;
  sColor: string;
  left: string;
  top: string;
  rotate: string;
}[];

const ENTER_FROM_LEFT = StyleSheetReanimated.keyframes({
  from: { transform: [{ translateX: "-100%" }] },
  to: { transform: [{ translateX: 0 }] },
});

const ENTER_FROM_RIGHT = StyleSheetReanimated.keyframes({
  from: { transform: [{ translateX: "100%" }] },
  to: { transform: [{ translateX: 0 }] },
});

const FLOAT = StyleSheetReanimated.keyframes({
  from: { transform: [{ translateY: -6 }] },
  to: { transform: [{ translateY: 6 }] },
});

export const PracticeHero = () => {
  return (
    <OnboardingHeroFrame>
      <View style={styles.questionCard}>
        <OnboardingQuestionCard />
      </View>
      <Animated.View style={styles.ball}>
        <AnimatedImage source={BALL} contentFit="contain" style={styles.ballFloat} />
      </Animated.View>
      <Image source={STATUE} contentFit="contain" style={styles.statue} />
      <Animated.View style={styles.mountains}>
        <AnimatedImage source={MOUNTAINS} contentFit="contain" style={styles.mountainsFloat} />
      </Animated.View>
      {SCATTERED_PILLS.map((pill) => (
        <View
          key={pill.name}
          style={[
            styles.pill,
            { left: pill.left, top: pill.top, transform: [{ rotate: pill.rotate }] },
          ]}
        >
          <CategoryPill
            icon={pill.icon}
            iconBg={pill.color}
            color={pill.sColor}
            label={pill.name}
          />
        </View>
      ))}
    </OnboardingHeroFrame>
  );
};

const styles = StyleSheetReanimated.create({
  questionCard: {
    position: "absolute",
    left: "17.3%",
    top: "-2.2%",
    width: "65.4%",
  },
  ball: {
    position: "absolute",
    left: "76.8%",
    top: "62.7%",
    width: "27.8%",
    aspectRatio: 114 / 113,
    animationName: ENTER_FROM_RIGHT,
    animationDuration: "1s",
    animationTimingFunction: "ease-out",
  },
  ballFloat: {
    width: "100%",
    height: "100%",
    animationName: FLOAT,
    animationDuration: "2.4s",
    animationIterationCount: "infinite",
    animationDirection: "alternate",
    animationTimingFunction: "ease-in-out",
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
    animationName: ENTER_FROM_LEFT,
    animationDuration: "1s",
    animationTimingFunction: "ease-out",
  },
  mountainsFloat: {
    width: "100%",
    height: "100%",
    animationName: FLOAT,
    animationDuration: "3s",
    animationIterationCount: "infinite",
    animationDirection: "alternate",
    animationTimingFunction: "ease-in-out",
  },
  pill: {
    position: "absolute",
  },
});
