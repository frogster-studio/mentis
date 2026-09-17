import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { ALL_SCREEN_EDGES, ScreenContainer } from "@/components/ui/screen-container";
import { QUIZ_SESSION_ONBOARDING_CTA_LABEL } from "@/features/onboarding/constants";
import { GUTTER, SPACE } from "@/theme/tokens";

export const QuizSessionOnboardingScreen = () => {
  const router = useRouter();

  return (
    <ScreenContainer edges={ALL_SCREEN_EDGES} underlay={null}>
      <View style={styles.legroom} />
      <View style={styles.actions}>
        <NewButton
          layout="block"
          shape="full"
          tone="default"
          icon="arrow-right"
          label={QUIZ_SESSION_ONBOARDING_CTA_LABEL}
          accessibilityLabel={null}
          onPress={() => router.push("/onboarding/end")}
          disabled={false}
          pending={false}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  legroom: {
    flex: 1,
  },
  actions: {
    paddingHorizontal: GUTTER + SPACE.lg,
    paddingBottom: SPACE.lg,
  },
});
