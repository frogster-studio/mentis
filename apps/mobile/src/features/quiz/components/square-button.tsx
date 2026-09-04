import { Pressable, StyleSheet, Text } from "react-native";
import { Squircle } from "@/components/ui/squircle";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

const LABEL_MAX_LINES = 2;
const TWO_LINE_TILE_HEIGHT = TEXT.body.lineHeight * LABEL_MAX_LINES + SPACE.md * 2;
// The Category colour is a tint over the white face, so ink stays legible on a dark Category.
const TINT_ALPHA = "66";

export interface SquareButtonProps {
  label: string;
  color: string;
  selected: boolean;
  onPress: () => void;
}

export const SquareButton = ({ label, color, selected, onPress }: SquareButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <Squircle
        radius={RADIUS.base}
        color={selected ? COLORS.face : `${COLORS.face}${TINT_ALPHA}`}
        borderColor={null}
        borderWidth={null}
        style={styles.face}
        corners="all"
      >
        {selected ? (
          <Squircle
            radius={RADIUS.base}
            color={`${color}${TINT_ALPHA}`}
            borderColor={null}
            borderWidth={null}
            style={StyleSheet.absoluteFill}
            corners="all"
          />
        ) : null}
        <Text
          style={[styles.label, selected && styles.labelSelected]}
          numberOfLines={LABEL_MAX_LINES}
        >
          {label}
        </Text>
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
  face: {
    height: TWO_LINE_TILE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACE.sm,
  },
  label: {
    ...TEXT.body,
    color: COLORS.inkMuted,
    textAlign: "center",
    userSelect: "none",
  },
  labelSelected: {
    color: COLORS.ink,
  },
});
