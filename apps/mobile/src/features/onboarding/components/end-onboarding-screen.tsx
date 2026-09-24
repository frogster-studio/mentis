import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { ALL_SCREEN_EDGES, ScreenContainer } from "@/components/ui/screen-container";
import { EndOnboardingVerdict } from "@/features/onboarding/components/end-onboarding-verdict";
import { LegalLine } from "@/features/onboarding/components/legal-line";
import {
  END_ONBOARDING_CAPTION,
  END_ONBOARDING_CTA_LABEL,
  END_ONBOARDING_TITLE,
} from "@/features/onboarding/constants";
import { isOnboardingOutcome } from "@/features/onboarding/outcome";
import { useOnboardingStore } from "@/features/onboarding/store";
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

  return (
    <ScreenContainer edges={ALL_SCREEN_EDGES} underlay={null}>
      <View style={styles.verdict}>
        <EndOnboardingVerdict outcome={outcome} answer={answer ?? ""} />
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
    flex: 1,
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.xl,
  },
  copy: {
    alignItems: "center",
    gap: SPACE.xs,
    paddingHorizontal: GUTTER + SPACE.lg,
    paddingVertical: SPACE.xl,
  },
  caption: {
    ...TEXT.body,
    color: COLORS.ink,
    textAlign: "center",
  },
  title: {
    ...TEXT.onboardingTitle,
    color: COLORS.ink,
    textAlign: "center",
  },
  actions: {
    paddingHorizontal: GUTTER + SPACE.lg,
    paddingBottom: SPACE.lg,
    gap: SPACE.md,
  },
});
