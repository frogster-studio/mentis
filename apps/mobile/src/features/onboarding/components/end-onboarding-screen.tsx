import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { ALL_SCREEN_EDGES, ScreenContainer } from "@/components/ui/screen-container";
import { LegalLine } from "@/features/onboarding/components/legal-line";
import { END_ONBOARDING_CTA_LABEL } from "@/features/onboarding/constants";
import { useOnboardingStore } from "@/features/onboarding/store";
import { GUTTER, SPACE } from "@/theme/tokens";

export const EndOnboardingScreen = () => {
  const router = useRouter();
  const complete = useOnboardingStore((state) => state.complete);

  return (
    <ScreenContainer edges={ALL_SCREEN_EDGES} underlay={null}>
      <View style={styles.legroom} />
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
  legroom: {
    flex: 1,
  },
  actions: {
    paddingHorizontal: GUTTER + SPACE.lg,
    paddingBottom: SPACE.lg,
    gap: SPACE.md,
  },
});
