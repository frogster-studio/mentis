import { Image } from "expo-image";
import { View } from "react-native";
import Animated, { css as StyleSheetReanimated } from "react-native-reanimated";
import { OnboardingHeroFrame } from "@/features/onboarding/components/onboarding-hero-frame";
import { OnboardingLeaderCard } from "@/features/onboarding/components/onboarding-leader-card";

const AnimatedImage = Animated.createAnimatedComponent(Image);

const SUMMIT = require("../../../../assets/images/onboarding/summit.webp");
const CROWN = require("../../../../assets/images/onboarding/crown.webp");

export const CompetitionHero = () => {
  return (
    <OnboardingHeroFrame>
      <Image source={SUMMIT} contentFit="contain" style={styles.summit} />
      <AnimatedImage source={CROWN} contentFit="contain" style={styles.crown} />
      <View style={styles.leader}>
        <OnboardingLeaderCard />
      </View>
    </OnboardingHeroFrame>
  );
};

const styles = StyleSheetReanimated.create({
  summit: {
    position: "absolute",
    bottom: -70,
    width: "110%",
    alignSelf: "center",
    aspectRatio: 992 / 876,
    zIndex: 1,
  },
  crown: {
    position: "absolute",
    top: 85,
    height: "15%",
    alignSelf: "center",
    aspectRatio: 228 / 210,
    animationName: {
      from: { transform: [{ rotate: "-6deg" }] },
      to: { transform: [{ rotate: "6deg" }] },
    },
    animationDuration: "1.5s",
    animationIterationCount: "infinite",
    animationDirection: "alternate",
    animationTimingFunction: "ease-in-out",
  },
  leader: {
    position: "absolute",
    left: "14.4%",
    top: "-2.6%",
    width: "71.7%",
  },
});
