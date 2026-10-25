import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import Animated, { css, FadeIn } from "react-native-reanimated";
import { QUICK_HOME_QUESTION_REVEAL_MS } from "@/features/quick-home-question/constants";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

const AnimatedFastSquircleView = Animated.createAnimatedComponent(FastSquircleView);

const LABEL_MAX_LINES = 2;
const TWO_LINE_BUTTON_HEIGHT = TEXT.body.lineHeight * LABEL_MAX_LINES + SPACE.md * 2;
const MISTAKE_ICON_SIZE = 16;

export interface QuickHomeQuestionChoiceButtonProps {
  label: string;
  revealsCorrect: boolean;
  revealsMistake: boolean;
  disabled: boolean;
  onPress: () => void;
}

export const QuickHomeQuestionChoiceButton = ({
  label,
  revealsCorrect,
  revealsMistake,
  disabled,
  onPress,
}: QuickHomeQuestionChoiceButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <AnimatedFastSquircleView
        style={[
          styles.face,
          revealsCorrect && styles.correctFace,
          revealsMistake && styles.mistakeFace,
        ]}
      >
        {revealsMistake ? (
          <Animated.View entering={FadeIn.duration(QUICK_HOME_QUESTION_REVEAL_MS)}>
            <MaterialCommunityIcons name="close" size={MISTAKE_ICON_SIZE} color={COLORS.danger} />
          </Animated.View>
        ) : null}
        <Animated.Text
          style={[styles.label, revealsCorrect && styles.correctLabel]}
          numberOfLines={LABEL_MAX_LINES}
        >
          {label}
        </Animated.Text>
      </AnimatedFastSquircleView>
    </Pressable>
  );
};

const styles = css.create({
  root: { flex: 1 },
  pressed: PRESSED,
  face: {
    height: TWO_LINE_BUTTON_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.xxs,
    paddingHorizontal: SPACE.sm,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.stroke,
    backgroundColor: COLORS.face,
    transitionProperty: ["backgroundColor", "borderColor"],
    transitionDuration: QUICK_HOME_QUESTION_REVEAL_MS,
  },
  correctFace: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  mistakeFace: { borderColor: COLORS.danger },
  label: {
    ...TEXT.body,
    flexShrink: 1,
    color: COLORS.ink,
    textAlign: "center",
    userSelect: "none",
    transitionProperty: "color",
    transitionDuration: QUICK_HOME_QUESTION_REVEAL_MS,
  },
  correctLabel: { color: COLORS.face },
});
