import { Image } from "expo-image";
import { Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import Animated, { css as StyleSheetReanimated } from "react-native-reanimated";
import {
  HERO_OVERLAY_SHADOW,
  OnboardingHeroFrame,
} from "@/features/onboarding/components/onboarding-hero-frame";
import {
  ONBOARDING_LEADER_POINTS,
  ONBOARDING_LEADER_PSEUDO,
} from "@/features/onboarding/constants";
import { POINTS_UNIT } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const AnimatedImage = Animated.createAnimatedComponent(Image);

const SUMMIT = require("../../../../assets/images/onboarding/summit.webp");
const CROWN = require("../../../../assets/images/onboarding/crown.webp");
const LEADER_AVATAR = require("../../../../assets/images/onboarding/leader-avatar.webp");

export const CompetitionHero = () => {
  return (
    <OnboardingHeroFrame>
      <Image source={SUMMIT} contentFit="contain" style={styles.summit} />
      <AnimatedImage source={CROWN} contentFit="contain" style={styles.crown} />
      <View style={[styles.leader, HERO_OVERLAY_SHADOW]}>
        <FastSquircleView style={styles.leaderRow}>
          <Image source={LEADER_AVATAR} contentFit="contain" style={styles.avatar} />
          <Text style={styles.pseudo} numberOfLines={1}>
            {ONBOARDING_LEADER_PSEUDO}
          </Text>
          <Text style={styles.points}>{`${ONBOARDING_LEADER_POINTS} ${POINTS_UNIT}`}</Text>
        </FastSquircleView>
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
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.face,
  },
  avatar: {
    height: SPACE.xxl,
    aspectRatio: 145 / 160,
    transform: [{ scaleX: -1 }],
  },
  pseudo: {
    ...TEXT.screenTitle,
    color: COLORS.ink,
    flex: 1,
  },
  points: {
    ...TEXT.captionStrong,
    color: COLORS.ink,
  },
});
