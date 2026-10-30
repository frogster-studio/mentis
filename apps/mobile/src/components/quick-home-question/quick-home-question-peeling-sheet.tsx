import type { PropsWithChildren } from "react";
import Animated, { css } from "react-native-reanimated";
import { QuickHomeQuestionSheet } from "@/components/quick-home-question/quick-home-question-sheet";
import { QUICK_HOME_QUESTION_EXIT_MS } from "@/features/quick-home-question/constants";

const PEEL_TILT = "-6deg";

const PEEL_OFF_LEFT = css.keyframes({
  from: { opacity: 1, transform: [{ translateX: 0 }, { rotate: "0deg" }] },
  to: { opacity: 0, transform: [{ translateX: "-100%" }, { rotate: PEEL_TILT }] },
});

export interface QuickHomeQuestionPeelingSheetProps {
  color: string;
  coversNextSheet: boolean;
}

export const QuickHomeQuestionPeelingSheet = ({
  children,
  color,
  coversNextSheet,
}: PropsWithChildren<QuickHomeQuestionPeelingSheetProps>) => {
  return (
    <Animated.View style={[styles.peeling, coversNextSheet && styles.overNextSheet]}>
      <QuickHomeQuestionSheet color={color}>{children}</QuickHomeQuestionSheet>
    </Animated.View>
  );
};

const styles = css.create({
  peeling: {
    animationName: PEEL_OFF_LEFT,
    animationDuration: QUICK_HOME_QUESTION_EXIT_MS,
    animationTimingFunction: "ease-in",
    animationFillMode: "forwards",
  },
  overNextSheet: { position: "absolute", top: 0, left: 0, right: 0 },
});
