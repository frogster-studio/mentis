import { Pressable, StyleSheet, Text } from "react-native";
import { Squircle } from "@/components/ui/squircle";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

export interface SquareButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const SquareButton = ({ label, selected, onPress }: SquareButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <Squircle
        radius={RADIUS.sm}
        color={selected ? COLORS.primary : COLORS.face}
        borderColor={selected ? COLORS.primary : COLORS.stroke}
        borderWidth={1}
        style={styles.face}
        corners="all"
      >
        <Text style={styles.label}>{label}</Text>
      </Squircle>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    flexBasis: "45%",
  },
  pressed: PRESSED,
  // flexGrow keeps the two cells of a row level while the taller label still sizes them.
  face: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACE.lg,
    paddingHorizontal: SPACE.sm,
  },
  label: {
    ...TEXT.label,
    color: COLORS.ink,
    textAlign: "center",
    userSelect: "none",
  },
});
