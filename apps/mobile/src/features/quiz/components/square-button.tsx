import { Pressable, StyleSheet, Text } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

const LABEL_MAX_LINES = 2;
const TWO_LINE_TILE_HEIGHT = TEXT.body.lineHeight * LABEL_MAX_LINES + SPACE.md * 2;

export interface SquareButtonProps {
  label: string;
  color: string;
  selected: boolean;
  oneIsSelected: boolean;
  onPress: () => void;
}

export const SquareButton = ({
  label,
  color,
  selected,
  oneIsSelected,
  onPress,
}: SquareButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.root,
        pressed && styles.pressed,
        oneIsSelected && !selected && styles.oneIsSelected,
      ]}
    >
      <FastSquircleView style={[styles.face, { backgroundColor: selected ? color : COLORS.face }]}>
        <Text style={styles.label} numberOfLines={LABEL_MAX_LINES}>
          {label}
        </Text>
      </FastSquircleView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: { flexGrow: 1, flexBasis: "45%" },
  pressed: PRESSED,
  face: {
    height: TWO_LINE_TILE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACE.sm,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.stroke,
  },
  label: {
    ...TEXT.body,
    color: COLORS.ink,
    textAlign: "center",
    userSelect: "none",
  },
  oneIsSelected: { opacity: 0.7 },
});
