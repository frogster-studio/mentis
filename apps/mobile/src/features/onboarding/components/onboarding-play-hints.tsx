import { Image } from "expo-image";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { gradient } from "@/utils/gradient";

const FAKE_KEYBOARD_IMAGE = require("../../../../assets/images/onboarding/fake-keyboard.webp");

const CASH_TILT = "4deg";
const SQUARE_TILT = "-6deg";
const BUBBLE_MAX_WIDTH = 226;

export interface OnboardingPlayHintsProps {
  onTry: () => void;
}

export const OnboardingPlayHints = ({ onTry }: OnboardingPlayHintsProps) => {
  const { height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={styles.block}>
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

      <View style={[styles.keyboardContainer, { bottom: -bottom }]}>
        <Image source={FAKE_KEYBOARD_IMAGE} style={styles.keyboardImage} />
      </View>

      <View style={styles.actions}>
        <NewButton
          layout="block"
          shape="full"
          tone="gradient-primary"
          icon="play-circle-outline"
          label={ONBOARDING_TRY_LABEL}
          accessibilityLabel={null}
          onPress={onTry}
          disabled={false}
          pending={false}
        />
      </View>

      <View style={[styles.gradientScrim, { bottom: -bottom, height: height / 1.6 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    paddingTop: SPACE.sm,
    paddingHorizontal: GUTTER + SPACE.sm,
  },
  cashHint: {
    zIndex: 1,
    alignSelf: "flex-start",
    marginLeft: SPACE.sm,
    maxWidth: BUBBLE_MAX_WIDTH,
  },
  cashArrow: {
    zIndex: 1,
    position: "absolute",
    left: "50%",
    top: -(CASH_HINT_ARROW_HEIGHT - SPACE.sm),
  },
  cashTilt: {
    transform: [{ rotate: CASH_TILT }],
  },
  squareHint: {
    zIndex: 1,
    alignSelf: "flex-end",
    marginTop: SPACE.lg,
    marginRight: SPACE.sm,
    maxWidth: BUBBLE_MAX_WIDTH,
  },
  keyboardContainer: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  gradientScrim: {
    ...gradient(`linear-gradient(to bottom, ${COLORS.ink}00, ${COLORS.ink}FF)`),
    position: "absolute",
    left: 0,
    right: 0,
  },
  keyboardImage: {
    width: "100%",
    aspectRatio: 1290 / 1030,
  },
  squareArrow: {
    zIndex: 1,
    position: "absolute",
    left: "55%",
    top: -(SQUARE_HINT_ARROW_HEIGHT - SPACE.sm),
    transform: [{ rotate: "12deg" }, { scaleX: -1 }],
  },
  squareTilt: {
    transform: [{ rotate: SQUARE_TILT }],
  },
  actions: {
    zIndex: 1,
    marginTop: SPACE.lg,
    paddingHorizontal: SPACE.sm,
    paddingBottom: SPACE.lg,
  },
});
