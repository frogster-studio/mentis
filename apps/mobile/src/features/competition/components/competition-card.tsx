import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image, type ImageSource } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { Card } from "@/components/ui/card";
import type { IconName } from "@/components/ui/icon-name";
import { NewButton } from "@/components/ui/new-button";
import { StreakBadge } from "@/features/account/components/streak-badge";
import { CompetitionCardBackground } from "@/features/competition/components/competition-card-background";
import { PremiumCrownStamp } from "@/features/premium/components/premium-crown-stamp";
import { RESULTS_SCORE_MAX_LABEL } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const QUESTION_MARK_COMPETITION_IMAGE = require("../../../../assets/images/competition/question-mark.png");
const PLACEHOLDER_PILL_IMAGE = require("../../../../assets/images/competition/placeholder-pill.png");
const CATEGORY_BADGE_SIZE = 36;

export interface CompetitionCardProps {
  title: string;
  teaser: string | null;
  score: number | null;
  colors: string[];
  streak: number;
  showPremium: boolean;
  actionLabel: string;
  onPress: () => void;
  themeImage?: ImageSource | number;
  categoryIcon?: IconName;
}

export const CompetitionCard = ({
  title,
  teaser,
  score,
  colors,
  streak,
  showPremium,
  actionLabel,
  onPress,
  themeImage,
  categoryIcon,
}: CompetitionCardProps) => {
  return (
    <View>
      <Card
        onPress={null}
        background={
          <CompetitionCardBackground
            colors={colors}
            isFinished={score !== null}
            themeImage={themeImage}
          />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>

          {teaser ? <Text style={styles.teaser}>{teaser}</Text> : null}

          <View style={styles.illustration} pointerEvents="none" accessible={false}>
            {score === null ? (
              <View style={styles.placeholderPillsContainer}>
                {[1, 2].map((index) => (
                  <PlaceholderPillColumn key={index} position={index} />
                ))}
              </View>
            ) : null}

            <FastSquircleView
              style={[
                styles.scoreCard,
                score === null ? styles.questionMarkCard : styles.playAgainCard,
              ]}
            >
              {score === null ? (
                <Image
                  source={QUESTION_MARK_COMPETITION_IMAGE}
                  contentFit="contain"
                  style={styles.questionMark}
                />
              ) : (
                <View style={styles.scoreRow}>
                  <Text style={styles.score}>{score}</Text>
                  <Text style={styles.scoreMax}>{RESULTS_SCORE_MAX_LABEL}</Text>
                </View>
              )}

              {score !== null && categoryIcon !== undefined ? (
                <FastSquircleView style={styles.categoryBadge}>
                  <MaterialIcons name={categoryIcon} size={18} color={COLORS.ink} />
                </FastSquircleView>
              ) : null}
            </FastSquircleView>
          </View>

          <View>
            <NewButton
              layout="block"
              shape="full"
              tone="default"
              label={actionLabel}
              icon="play-circle-outline"
              accessibilityLabel={null}
              disabled={false}
              pending={false}
              onPress={onPress}
            />
            {showPremium ? (
              <View style={styles.premiumContainer}>
                <PremiumCrownStamp />
              </View>
            ) : null}
          </View>
        </View>
      </Card>

      <StreakBadge streak={streak} />
    </View>
  );
};

const PlaceholderPillColumn = ({ position }: { position: number }) => {
  const deg = position === 1 ? 1 : -1;

  return (
    <View style={{ gap: SPACE.lg }}>
      <Image
        source={PLACEHOLDER_PILL_IMAGE}
        contentFit="contain"
        style={[
          styles.placeholderPillImage,
          { transform: [{ rotate: `${deg * -3}deg` }], marginLeft: deg * SPACE.lg },
        ]}
      />
      <Image
        source={PLACEHOLDER_PILL_IMAGE}
        contentFit="contain"
        style={[styles.placeholderPillImage, { transform: [{ rotate: `${deg * 7}deg` }] }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: SPACE.md },
  title: {
    ...TEXT.sectionTitle,
    color: COLORS.ink,
    textAlign: "center",
    paddingHorizontal: SPACE.xxl,
  },
  teaser: { ...TEXT.caption, color: COLORS.ink, textAlign: "center", marginTop: SPACE.xs },
  illustration: {
    marginTop: SPACE.md,
    alignItems: "center",
  },
  choiceTopLeft: { left: "14%", top: SPACE.xs, transform: [{ rotate: "-4deg" }] },
  choiceTopRight: { right: "14%", top: SPACE.md, transform: [{ rotate: "5deg" }] },
  choiceBottomLeft: { left: 0, bottom: SPACE.md, transform: [{ rotate: "6deg" }] },
  choiceBottomRight: { right: 0, bottom: SPACE.sm, transform: [{ rotate: "-7deg" }] },
  scoreCard: {
    paddingHorizontal: SPACE.lg,
    alignItems: "center",
    marginTop: SPACE.xs,
    borderWidth: 1,
    borderBottomEndRadius: 0,
    borderBottomStartRadius: 0,
    borderRadius: RADIUS.base,
  },
  mystery: { ...TEXT.display, color: COLORS.background, paddingTop: SPACE.lg },
  scoreRow: { flexDirection: "row", alignItems: "baseline" },
  score: { ...TEXT.competitionScore, color: COLORS.face },
  scoreMax: { ...TEXT.body, color: `${COLORS.face}40` },
  categoryBadge: {
    position: "absolute",
    top: -SPACE.xs,
    right: -SPACE.md,
    width: CATEGORY_BADGE_SIZE,
    height: CATEGORY_BADGE_SIZE,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.face,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumContainer: {
    position: "absolute",
    top: -SPACE.xl,
    right: -SPACE.sm,
  },
  questionMark: {
    aspectRatio: 135 / 222,
    width: 45,
    marginBottom: -15,
  },
  playAgainCard: {
    borderColor: COLORS.stroke,
    backgroundColor: COLORS.scrim,
  },
  questionMarkCard: {
    borderColor: "#CF8A50",
    backgroundColor: "#B67F50",
    aspectRatio: 2,
    paddingTop: SPACE.lg,
  },
  placeholderPillsContainer: {
    position: "absolute",
    height: SPACE.xxl,
    opacity: 0.5,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    right: 0,
  },
  placeholderPillImage: {
    width: 110,
    aspectRatio: 357 / 105,
  },
});
