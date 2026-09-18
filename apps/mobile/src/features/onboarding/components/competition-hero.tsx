import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { Squircle } from "@/components/ui/squircle";
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

const SUMMIT = require("../../../../assets/images/onboarding/summit.png");
const CROWN = require("../../../../assets/images/onboarding/crown.png");
const LEADER_AVATAR = require("../../../../assets/images/onboarding/leader-avatar.png");

// The mockup softens the summit so the crown and the leader read first.
const SUMMIT_BLUR_RADIUS = SPACE.md;

export const CompetitionHero = () => {
  return (
    <OnboardingHeroFrame>
      <Image
        source={SUMMIT}
        contentFit="contain"
        blurRadius={SUMMIT_BLUR_RADIUS}
        style={styles.summit}
      />
      <Image source={CROWN} contentFit="contain" style={styles.crown} />
      <View style={[styles.leader, HERO_OVERLAY_SHADOW]}>
        <Squircle
          radius={RADIUS.sm}
          corners="all"
          color={COLORS.face}
          borderColor={null}
          borderWidth={null}
          style={styles.leaderRow}
        >
          <Image source={LEADER_AVATAR} contentFit="contain" style={styles.avatar} />
          <Text style={styles.pseudo} numberOfLines={1}>
            {ONBOARDING_LEADER_PSEUDO}
          </Text>
          <Text style={styles.points}>{`${ONBOARDING_LEADER_POINTS} ${POINTS_UNIT}`}</Text>
        </Squircle>
      </View>
    </OnboardingHeroFrame>
  );
};

const styles = StyleSheet.create({
  summit: {
    position: "absolute",
    left: "-6.1%",
    top: "20.2%",
    width: "112.4%",
    aspectRatio: 1203 / 1029,
  },
  crown: {
    position: "absolute",
    left: "41.7%",
    top: "9.1%",
    width: "18.5%",
    aspectRatio: 300 / 280,
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
    paddingLeft: SPACE.sm,
    paddingRight: SPACE.lg,
  },
  // The mockup mirrors the portrait so she faces her name.
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
