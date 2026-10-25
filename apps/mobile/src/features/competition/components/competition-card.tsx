import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image, type ImageSource } from "expo-image";
import {
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { Card } from "@/components/ui/card";
import type { IconName } from "@/components/ui/icon-name";
import { NewButton } from "@/components/ui/new-button";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakBadge } from "@/features/account/components/streak-badge";
import { CompetitionCardBackground } from "@/features/competition/components/competition-card-background";
import { PremiumCrownStamp } from "@/features/premium/components/premium-crown-stamp";
import { RESULTS_SCORE_MAX_LABEL } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";
import { PLACEHOLDER_PILL_IMAGE } from "@/utils/assets";

const QUESTION_MARK_COMPETITION_IMAGE = require("../../../../assets/images/competition/question-mark.png");
const CATEGORY_BADGE_SIZE = 36;

export interface CompetitionCardProps {
  title: string;
  teaser: string | null;
  score: number | null;
  colors: string[];
  streak: number;
  showPremium: boolean;
  actionLabel: string;
  // False until a usable Day says which card this is: the copy then only sizes its skeletons.
  isStateKnown: boolean;
  // A finished card's Theme, null until its transcript lands.
  theme: { image: ImageSource; categoryIcon: IconName } | null;
  isFrozen: boolean;
  onPress: () => void;
  onRetry: () => void;
}

export const CompetitionCard = ({
  title,
  teaser,
  score,
  colors,
  streak,
  showPremium,
  actionLabel,
  isStateKnown,
  theme,
  isFrozen,
  onPress,
  onRetry,
}: CompetitionCardProps) => {
  return (
    <View>
      <Card
        onPress={isFrozen ? onRetry : null}
        background={
          <CompetitionCardBackground
            colors={colors}
            isFinished={score !== null}
            themeImage={theme?.image ?? null}
            isFrozen={isFrozen}
          />
        }
      >
        <View style={styles.content}>
          {isStateKnown ? (
            <Text style={[styles.title, styles.titleInset]}>{title}</Text>
          ) : (
            <TextSkeleton
              text={title}
              textStyle={styles.title}
              isFrozen={isFrozen}
              style={styles.titleInset}
            />
          )}

          {teaser === null ? null : isStateKnown ? (
            <Text style={[styles.teaser, styles.teaserInset]}>{teaser}</Text>
          ) : (
            <TextSkeleton
              text={teaser}
              textStyle={styles.teaser}
              isFrozen={isFrozen}
              style={styles.teaserInset}
            />
          )}

          <View style={styles.illustration} pointerEvents="none" accessible={false}>
            {score === null ? (
              <View style={styles.placeholderPillsContainer}>
                {[1, 2].map((index) => (
                  <PlaceholderPillColumn key={index} position={index} />
                ))}
              </View>
            ) : null}

            {isStateKnown ? (
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

                {score === null ? null : theme === null ? (
                  <Skeleton
                    radius={RADIUS.sm}
                    isOnDark
                    isFrozen={isFrozen}
                    style={styles.categoryBadge}
                  />
                ) : (
                  <FastSquircleView style={[styles.categoryBadge, styles.categoryBadgeFace]}>
                    <MaterialIcons name={theme.categoryIcon} size={18} color={COLORS.ink} />
                  </FastSquircleView>
                )}
              </FastSquircleView>
            ) : (
              <View style={[styles.scoreCard, styles.questionMarkCard, styles.ghostTile]}>
                <View style={styles.questionMark} />
                <Skeleton
                  radius={RADIUS.base}
                  isOnDark={false}
                  isFrozen={isFrozen}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            )}
          </View>

          <View>
            <NewButton
              layout="block"
              shape="full"
              tone="default"
              label={
                isStateKnown ? (
                  actionLabel
                ) : (
                  <TextSkeleton
                    text={actionLabel}
                    textStyle={TEXT.label}
                    isFrozen={isFrozen}
                    style={null}
                  />
                )
              }
              icon="play-circle-outline"
              accessibilityLabel={null}
              disabled={false}
              pending={false}
              onPress={isStateKnown ? onPress : null}
            />
            {showPremium ? (
              <View style={styles.premiumStampSlot}>
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

interface TextSkeletonProps {
  text: string;
  textStyle: StyleProp<TextStyle>;
  isFrozen: boolean;
  style: StyleProp<ViewStyle>;
}

// Sized by the invisible copy it stands for, so the resolved text lands without a layout shift.
const TextSkeleton = ({ text, textStyle, isFrozen, style }: TextSkeletonProps) => (
  <View
    style={[styles.textSkeleton, style]}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    <Text style={[textStyle, styles.ghost]}>{text}</Text>
    <Skeleton
      radius={RADIUS.sm}
      isOnDark={false}
      isFrozen={isFrozen}
      style={StyleSheet.absoluteFill}
    />
  </View>
);

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
  title: { ...TEXT.sectionTitle, color: COLORS.ink, textAlign: "center" },
  titleInset: { marginHorizontal: SPACE.xxl },
  teaser: { ...TEXT.caption, color: COLORS.ink, textAlign: "center" },
  teaserInset: { marginTop: SPACE.xs },
  textSkeleton: { alignSelf: "center" },
  ghost: { opacity: 0 },
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
  },
  categoryBadgeFace: {
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.face,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumStampSlot: {
    position: "absolute",
    top: SPACE.md,
    right: 0,
    transform: [{ rotate: "6deg" }],
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
  ghostTile: { borderColor: COLORS.clear, backgroundColor: COLORS.clear },
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
