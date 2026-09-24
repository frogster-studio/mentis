import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { PaywallHeroGradient } from "@/features/premium/components/paywall-hero-gradient";
import { RADIUS } from "@/theme/tokens";

// The card keeps the mockup's proportions, so every piece sits at its measured fraction of it.
const HERO_ASPECT_RATIO = 410 / 461;

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    aspectRatio: HERO_ASPECT_RATIO,
  },
  face: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    borderRadius: RADIUS.base,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
});

// Children stack over the gradient unclipped, so a card can peek over the top edge.
export const OnboardingHeroFrame = ({ children }: PropsWithChildren) => {
  return (
    <View style={styles.hero} pointerEvents="none" accessible={false}>
      <FastSquircleView style={styles.face}>
        <PaywallHeroGradient />
      </FastSquircleView>
      {children}
    </View>
  );
};
