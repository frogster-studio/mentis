import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image, type ImageSource } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { Card } from "@/components/ui/card";
import type { IconName } from "@/components/ui/icon-name";
import { NewButton } from "@/components/ui/new-button";
import { CompetitionCardBackground } from "@/features/competition/components/competition-card-background";
import { COMPETITION_MYSTERY, COMPETITION_STREAK_LABEL } from "@/features/competition/constants";
import { PremiumCrownStamp } from "@/features/premium/components/premium-crown-stamp";
import { RESULTS_SCORE_MAX_LABEL } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_ICON_SIZE, RADIUS, SPACE } from "@/theme/tokens";

const MYSTERY_CHOICE_IMAGE = require("../../../../assets/images/competition/mystery-choice.png");
const FLAME_IMAGE = require("../../../../assets/images/competition/flame.png");
const CATEGORY_BADGE_SIZE = 36;

export interface CompetitionCardProps {
  title: string;
  teaser: string | null;
  score: number | null;
  colors: string[];
  showStreak: boolean;
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
  showStreak,
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
              <View style={StyleSheet.absoluteFill}>
                {Object.entries({
                  topLeft: styles.choiceTopLeft,
                  topRight: styles.choiceTopRight,
                  bottomLeft: styles.choiceBottomLeft,
                  bottomRight: styles.choiceBottomRight,
                }).map(([key, position]) => (
                  <Image
                    key={key}
                    source={MYSTERY_CHOICE_IMAGE}
                    contentFit="contain"
                    style={[styles.choice, position]}
                    accessible={false}
                  />
                ))}
              </View>
            ) : null}
            <View>
              <FastSquircleView
                style={[
                  styles.scoreCard,
                  {
                    borderColor: score === null ? COLORS.primaryPlaceholder : COLORS.stroke,
                    backgroundColor: score === null ? COLORS.primaryPlaceholder : COLORS.scrim,
                  },
                ]}
              >
                {score === null ? (
                  <Text style={styles.mystery}>{COMPETITION_MYSTERY}</Text>
                ) : (
                  <View style={styles.scoreRow}>
                    <Text style={styles.score}>{score}</Text>
                    <Text style={styles.scoreMax}>{RESULTS_SCORE_MAX_LABEL}</Text>
                  </View>
                )}
              </FastSquircleView>

              {score !== null && categoryIcon !== undefined ? (
                <View style={styles.categoryBadge}>
                  <MaterialIcons name={categoryIcon} size={CONTROL_ICON_SIZE} color={COLORS.ink} />
                </View>
              ) : null}
            </View>
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
      {showStreak ? (
        <View
          style={styles.streak}
          pointerEvents="none"
          accessibilityLabel={COMPETITION_STREAK_LABEL}
        >
          <FastSquircleView style={styles.streakBadge}>
            <Text style={styles.streakNumber}>100</Text>
          </FastSquircleView>
          <Image
            source={FLAME_IMAGE}
            contentFit="contain"
            style={styles.flame}
            accessible={false}
          />
        </View>
      ) : null}
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
    overflow: "hidden",
  },
  choice: { position: "absolute", width: "34%", height: SPACE.xxl, opacity: 0.5 },
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
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.face,
    alignItems: "center",
    justifyContent: "center",
  },

  streak: { position: "absolute", right: SPACE.md, top: SPACE.sm },
  streakBadge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.scrim,
    borderRadius: RADIUS.sm,
    height: 42,
    minWidth: 42,
    paddingHorizontal: SPACE.sm,
  },
  premiumContainer: {
    position: "absolute",
    top: -SPACE.xl,
    right: -SPACE.sm,
  },
  streakNumber: { ...TEXT.statValue, color: COLORS.face, transform: [{ rotate: "-6deg" }] },
  flame: {
    position: "absolute",
    aspectRatio: 219 / 249,
    height: "200%",
    top: -42,
    right: -40,
    transform: [{ rotate: "6deg" }],
  },
});
