import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { LogoMark } from "@/components/logo-mark";
import { LogoWordmark } from "@/components/logo-wordmark";
import { Button } from "@/components/ui/button";
import { ALL_SCREEN_EDGES, ScreenContainer } from "@/components/ui/screen-container";
import { LegalLine } from "@/features/onboarding/components/legal-line";
import { ONBOARDING_START_LABEL } from "@/features/onboarding/constants";
import { useOnboardingStore } from "@/features/onboarding/store";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

const MARK_SIZE = 96;
const WORDMARK_WIDTH = 180;

export const OnboardingScreen = () => {
  const router = useRouter();
  const complete = useOnboardingStore((state) => state.complete);

  return (
    <ScreenContainer edges={ALL_SCREEN_EDGES} background={null} underlay={null}>
      <View style={styles.headroom} />
      <View style={styles.logo}>
        <LogoMark color={COLORS.primary} size={MARK_SIZE} />
        <LogoWordmark color={COLORS.ink} width={WORDMARK_WIDTH} />
      </View>
      <View style={styles.legroom} />
      <View style={styles.actions}>
        <Button
          label={ONBOARDING_START_LABEL}
          onPress={() => {
            complete();
            router.replace("/");
          }}
          pending={false}
        />
        <LegalLine />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  // The 1:2 spacer ratio sits the logo above the screen's centre line.
  headroom: {
    flex: 1,
  },
  legroom: {
    flex: 2,
  },
  logo: {
    alignItems: "center",
    gap: SPACE.lg,
  },
  actions: {
    paddingHorizontal: GUTTER,
    paddingBottom: SPACE.lg,
    gap: SPACE.md,
  },
});
