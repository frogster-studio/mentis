import { Pressable, StyleSheet, Text } from "react-native";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";

const HOME_LINK_HEIGHT = TEXT.label.lineHeight + SPACE.md * 2;

export interface ResultsHomeLinkProps {
  label: string;
  onPress: () => void;
}

// The quiet way out under a primary action, so leaving never competes with playing again.
export const ResultsHomeLink = ({ label, onPress }: ResultsHomeLinkProps) => {
  return (
    <Pressable style={({ pressed }) => [styles.link, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  link: {
    height: HOME_LINK_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: PRESSED,
  label: {
    ...TEXT.label,
    color: COLORS.ink,
    textDecorationLine: "underline",
  },
});
