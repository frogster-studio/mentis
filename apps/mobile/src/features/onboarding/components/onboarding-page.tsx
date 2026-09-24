import type { ReactNode } from "react";
import { View } from "react-native";
import Animated, { css as StyleSheetReanimated } from "react-native-reanimated";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

export interface OnboardingPageProps {
  hero: ReactNode;
  caption: string;
  emblem: ReactNode;
  title: string;
  action: ReactNode;
  isRevealed: boolean;
}

const FADE_IN = StyleSheetReanimated.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

export const OnboardingPage = ({
  hero,
  caption,
  emblem,
  title,
  action,
  isRevealed,
}: OnboardingPageProps) => {
  return (
    <View style={styles.page}>
      {hero}
      {/* The copy mounts on the page's first reveal, so its fade plays where the Player sees it. */}
      <View style={styles.copy}>
        {isRevealed ? (
          <>
            <Animated.Text style={styles.caption}>{caption}</Animated.Text>
            {emblem ? <Animated.View style={styles.emblem}>{emblem}</Animated.View> : null}
            <Animated.Text style={styles.title}>{title}</Animated.Text>
          </>
        ) : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
};

const styles = StyleSheetReanimated.create({
  page: {
    flex: 1,
    overflow: "hidden",
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.xl,
  },
  copy: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACE.xs,
    paddingHorizontal: SPACE.lg,
  },
  caption: {
    ...TEXT.body,
    color: COLORS.ink,
    textAlign: "center",
    animationName: FADE_IN,
    animationDuration: "500ms",
  },
  emblem: {
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: SPACE.sm,
    animationName: FADE_IN,
    animationDuration: "500ms",
    animationDelay: "250ms",
    animationFillMode: "backwards",
  },
  title: {
    ...TEXT.onboardingTitle,
    color: COLORS.ink,
    textAlign: "center",
    animationName: FADE_IN,
    animationDuration: "500ms",
    animationDelay: "500ms",
    animationFillMode: "backwards",
  },
  action: {
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.xl,
  },
});
