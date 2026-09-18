import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { ALL_SCREEN_EDGES, ScreenContainer } from "@/components/ui/screen-container";
import { LegalLine } from "@/features/onboarding/components/legal-line";
import {
  END_ONBOARDING_CAPTION,
  END_ONBOARDING_CTA_LABEL,
  END_ONBOARDING_OUTCOME_COPY,
  END_ONBOARDING_TITLE,
  ONBOARDING_QUESTION,
} from "@/features/onboarding/constants";
import { isOnboardingOutcome, outcomePoints } from "@/features/onboarding/outcome";
import { useOnboardingStore } from "@/features/onboarding/store";
import { ResultCard } from "@/features/quiz/components/result-card";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

export const EndOnboardingScreen = () => {
  const router = useRouter();
  const complete = useOnboardingStore((state) => state.complete);
  const { outcome: outcomeParam, answer } = useLocalSearchParams<{
    outcome?: string;
    answer?: string;
  }>();
  // Landing here without a verdict reads as a test never taken.
  const outcome = isOnboardingOutcome(outcomeParam) ? outcomeParam : "missed";
  const copy = END_ONBOARDING_OUTCOME_COPY[outcome];
  const points = outcomePoints(outcome);

  return (
    <ScreenContainer edges={ALL_SCREEN_EDGES} underlay={null}>
      <View style={styles.verdict}>
        <Text style={styles.verdictTitle}>{copy.title}</Text>
        <ResultCard
          position={1}
          total={1}
          questionText={ONBOARDING_QUESTION.text}
          canonicalAnswer={ONBOARDING_QUESTION.answer}
          answerText={answer ?? ""}
          correct={points > 0}
          points={points}
        />
        <Text style={styles.verdictLine}>{copy.line}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.caption}>{END_ONBOARDING_CAPTION}</Text>
        <Text style={styles.title}>{END_ONBOARDING_TITLE}</Text>
      </View>
      <View style={styles.actions}>
        <NewButton
          layout="block"
          shape="full"
          tone="primary"
          icon="play-circle-outline"
          label={END_ONBOARDING_CTA_LABEL}
          accessibilityLabel={null}
          onPress={() => {
            complete();
            router.replace("/");
          }}
          disabled={false}
          pending={false}
        />
        <LegalLine />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  verdict: {
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.xxl,
    gap: SPACE.lg,
  },
  verdictTitle: {
    ...TEXT.sectionTitle,
    color: COLORS.ink,
    textAlign: "center",
  },
  verdictLine: {
    ...TEXT.body,
    color: COLORS.ink,
    textAlign: "center",
    paddingHorizontal: SPACE.lg,
  },
  copy: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACE.xs,
    paddingHorizontal: GUTTER + SPACE.lg,
  },
  caption: {
    ...TEXT.body,
    color: COLORS.ink,
    textAlign: "center",
  },
  title: {
    ...TEXT.sectionTitle,
    color: COLORS.ink,
    textAlign: "center",
  },
  actions: {
    paddingHorizontal: GUTTER + SPACE.lg,
    paddingBottom: SPACE.lg,
    gap: SPACE.md,
  },
});
