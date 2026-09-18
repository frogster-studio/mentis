import { StyleSheet, Text } from "react-native";
import { Squircle } from "@/components/ui/squircle";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

export interface OnboardingHintBubbleProps {
  text: string;
  points: string;
}

export const OnboardingHintBubble = ({ text, points }: OnboardingHintBubbleProps) => {
  return (
    <Squircle
      radius={RADIUS.base}
      corners="all"
      color={COLORS.ink}
      borderColor={null}
      borderWidth={null}
      style={styles.bubble}
    >
      <Text style={styles.text}>{text}</Text>
      <Text style={styles.points}>{points}</Text>
    </Squircle>
  );
};

const styles = StyleSheet.create({
  bubble: {
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    alignItems: "center",
  },
  text: {
    ...TEXT.body,
    color: COLORS.face,
    textAlign: "center",
  },
  points: {
    ...TEXT.label,
    color: COLORS.face,
    textAlign: "center",
  },
});
