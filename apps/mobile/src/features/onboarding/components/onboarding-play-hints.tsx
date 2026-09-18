import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { NewButton } from "@/components/ui/new-button";
import {
  CASH_HINT_ARROW_HEIGHT,
  CashHintArrow,
} from "@/features/onboarding/components/cash-hint-arrow";
import { OnboardingHintBubble } from "@/features/onboarding/components/onboarding-hint-bubble";
import {
  SQUARE_HINT_ARROW_HEIGHT,
  SquareHintArrow,
} from "@/features/onboarding/components/square-hint-arrow";
import {
  ONBOARDING_HINT_CASH,
  ONBOARDING_HINT_CASH_POINTS,
  ONBOARDING_HINT_SQUARE,
  ONBOARDING_HINT_SQUARE_POINTS,
  ONBOARDING_TRY_LABEL,
} from "@/features/onboarding/constants";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

const SCRIM_ID = "onboardingPlayScrim";
const SCRIM_HEIGHT_RATIO = 0.4;
const CASH_TILT = "4deg";
const SQUARE_TILT = "-6deg";
// « Soit tu choisis entre 4 propositions » breaks after « 4 » inside the mockup's 226 pt bubble.
const BUBBLE_MAX_WIDTH = 226;

export interface OnboardingPlayHintsProps {
  onTry: () => void;
}

// Drawn under the answer controls in their keyboard's place: the two ways to answer, then « Essayer ».
export const OnboardingPlayHints = ({ onTry }: OnboardingPlayHintsProps) => {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.block}>
      <Svg style={[styles.scrim, { bottom: -insets.bottom, height: height * SCRIM_HEIGHT_RATIO }]}>
        <Defs>
          <LinearGradient id={SCRIM_ID} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.ink} stopOpacity="0" />
            <Stop offset="1" stopColor={COLORS.ink} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${SCRIM_ID})`} />
      </Svg>
      <View style={styles.cashHint}>
        <View style={styles.cashArrow}>
          <CashHintArrow />
        </View>
        <View style={styles.cashTilt}>
          <OnboardingHintBubble text={ONBOARDING_HINT_CASH} points={ONBOARDING_HINT_CASH_POINTS} />
        </View>
      </View>
      <View style={styles.squareHint}>
        <View style={styles.squareArrow}>
          <SquareHintArrow />
        </View>
        <View style={styles.squareTilt}>
          <OnboardingHintBubble
            text={ONBOARDING_HINT_SQUARE}
            points={ONBOARDING_HINT_SQUARE_POINTS}
          />
        </View>
      </View>
      <View style={styles.actions}>
        <NewButton
          layout="block"
          shape="full"
          tone="primary"
          icon="play-circle-outline"
          label={ONBOARDING_TRY_LABEL}
          accessibilityLabel={null}
          onPress={onTry}
          disabled={false}
          pending={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    paddingTop: SPACE.sm,
    paddingHorizontal: GUTTER + SPACE.sm,
  },
  // Runs to the screen's bottom edge, under the inset the block itself never spends.
  scrim: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  cashHint: {
    alignSelf: "flex-start",
    marginLeft: SPACE.sm,
    maxWidth: BUBBLE_MAX_WIDTH,
  },
  // Each arrow roots a little inside its bubble's top edge and reaches the control above.
  cashArrow: {
    position: "absolute",
    left: "50%",
    top: -(CASH_HINT_ARROW_HEIGHT - SPACE.sm),
  },
  cashTilt: {
    transform: [{ rotate: CASH_TILT }],
  },
  squareHint: {
    alignSelf: "flex-end",
    marginTop: SPACE.lg,
    marginRight: SPACE.sm,
    maxWidth: BUBBLE_MAX_WIDTH,
  },
  // Mirrored, so the long arrow bows towards the Carré switch as it does in the mockup.
  squareArrow: {
    position: "absolute",
    left: "55%",
    top: -(SQUARE_HINT_ARROW_HEIGHT - SPACE.sm),
    transform: [{ rotate: "12deg" }, { scaleX: -1 }],
  },
  squareTilt: {
    transform: [{ rotate: SQUARE_TILT }],
  },
  actions: {
    marginTop: SPACE.lg,
    paddingHorizontal: SPACE.sm,
    paddingBottom: SPACE.lg,
  },
});
