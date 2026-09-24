import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { OnboardingCheckmark } from "@/features/onboarding/components/onboarding-checkmark";
import {
  END_ONBOARDING_OUTCOME_TITLE,
  END_ONBOARDING_SCORING_LINES,
  ONBOARDING_QUESTION,
} from "@/features/onboarding/constants";
import { type OnboardingOutcome, outcomePoints } from "@/features/onboarding/outcome";
import { ResultCard } from "@/features/quiz/components/result-card";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";
import { gradient } from "@/utils/gradient";

const SUCCESS_GLOW = gradient(
  `radial-gradient(closest-side at 50% 40%, #83D3AF, ${COLORS.catchupWash})`,
);
const FAIL_GLOW = gradient("radial-gradient(closest-side at 50% 40%, #FF7657, #FFD3C9)");

export interface EndOnboardingVerdictProps {
  outcome: OnboardingOutcome;
  answer: string;
}

export const EndOnboardingVerdict = ({ outcome, answer }: EndOnboardingVerdictProps) => {
  const points = outcomePoints(outcome);
  const isCorrect = points > 0;

  return (
    <FastSquircleView style={styles.panel}>
      <View style={[StyleSheet.absoluteFill, isCorrect ? SUCCESS_GLOW : FAIL_GLOW]} />
      {/* Hidden rather than dropped on a miss, so the title holds its place across outcomes. */}
      <View style={[styles.checkmark, !isCorrect && styles.hidden]}>
        <OnboardingCheckmark />
      </View>

      <Text style={styles.title}>{END_ONBOARDING_OUTCOME_TITLE[outcome]}</Text>

      <ResultCard
        position={1}
        total={1}
        questionText={ONBOARDING_QUESTION.text}
        canonicalAnswer={ONBOARDING_QUESTION.answer}
        answerText={answer}
        correct={isCorrect}
        points={points}
      />

      <View>
        {END_ONBOARDING_SCORING_LINES.map(({ lead, points: linePoints }) => (
          <Text key={lead} style={styles.scoring}>
            {lead}
            <Text style={styles.scoringPoints}>{linePoints}</Text>
          </Text>
        ))}
      </View>
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    justifyContent: "center",
    gap: SPACE.lg,
    overflow: "hidden",
    paddingHorizontal: SPACE.xl,
    borderRadius: RADIUS.base,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  checkmark: {
    alignSelf: "center",
  },
  hidden: {
    opacity: 0,
  },
  title: {
    ...TEXT.onboardingTitle,
    color: COLORS.ink,
    textAlign: "center",
  },
  scoring: {
    ...TEXT.body,
    color: COLORS.ink,
    textAlign: "center",
  },
  scoringPoints: {
    fontFamily: TEXT.captionStrong.fontFamily,
  },
});
