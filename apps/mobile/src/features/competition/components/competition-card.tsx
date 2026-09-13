import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { NewButton } from "@/components/ui/new-button";
import { Squircle } from "@/components/ui/squircle";
import { CompetitionCardBackground } from "@/features/competition/components/competition-card-background";
import { COMPETITION_MYSTERY, COMPETITION_STREAK_LABEL } from "@/features/competition/constants";
import { RESULTS_SCORE_MAX_LABEL } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, RADIUS, SPACE } from "@/theme/tokens";

export interface CompetitionCardProps {
  title: string;
  teaser: string | null;
  score: number | null;
  color: string;
  showStreak: boolean;
  showPremium: boolean;
  actionLabel: string;
  onPress: () => void;
}

export const CompetitionCard = ({
  title,
  teaser,
  score,
  color,
  showStreak,
  showPremium,
  actionLabel,
  onPress,
}: CompetitionCardProps) => {
  return (
    <View>
      <Card
        onPress={null}
        background={<CompetitionCardBackground color={color} isFinished={score !== null} />}
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
                    source={require("../../../../assets/images/competition/mystery-choice.png")}
                    contentFit="contain"
                    style={[styles.choice, position]}
                    accessible={false}
                  />
                ))}
              </View>
            ) : null}
            <Squircle
              radius={RADIUS.sm}
              corners="top"
              color={score === null ? COLORS.primaryPlaceholder : COLORS.scrim}
              borderColor={COLORS.stroke}
              borderWidth={1}
              style={styles.scoreCard}
            >
              {score === null ? (
                <Text style={styles.mystery}>{COMPETITION_MYSTERY}</Text>
              ) : (
                <View style={styles.scoreRow}>
                  <Text style={styles.score}>{score}</Text>
                  <Text style={styles.scoreMax}>{RESULTS_SCORE_MAX_LABEL}</Text>
                </View>
              )}
            </Squircle>
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
              <Image
                source={require("../../../../assets/images/premium-crown.png")}
                contentFit="contain"
                style={styles.crown}
                pointerEvents="none"
                accessible={false}
              />
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
          <Squircle
            radius={RADIUS.sm}
            corners="all"
            color={COLORS.scrim}
            borderColor={null}
            borderWidth={null}
            style={styles.streakBadge}
          >
            <Text style={styles.streakNumber}>3</Text>
          </Squircle>
          <Image
            source={require("../../../../assets/images/competition/flame.png")}
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
    height: TEXT.heroScore.lineHeight,
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
    minWidth: CONTROL_SQUARE_SIZE * 2,
    paddingHorizontal: SPACE.lg,
    alignItems: "center",
    minHeight: TEXT.heroScore.lineHeight + SPACE.lg,
    marginTop: SPACE.xs,
  },
  mystery: { ...TEXT.display, color: COLORS.background, paddingTop: SPACE.lg },
  scoreRow: { flexDirection: "row", alignItems: "baseline" },
  score: { ...TEXT.heroScore, color: COLORS.face },
  scoreMax: { ...TEXT.body, color: `${COLORS.face}80` },
  crown: {
    position: "absolute",
    width: CONTROL_SQUARE_SIZE,
    height: CONTROL_SQUARE_SIZE,
    right: SPACE.xs,
    top: -SPACE.xl,
  },
  streak: { position: "absolute", right: SPACE.md, top: SPACE.sm },
  streakBadge: {
    width: SPACE.xxl,
    height: SPACE.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  streakNumber: { ...TEXT.statValue, color: COLORS.face },
  flame: {
    position: "absolute",
    width: SPACE.xl,
    height: SPACE.xxl,
    right: -SPACE.sm,
    top: -SPACE.xl,
  },
});
