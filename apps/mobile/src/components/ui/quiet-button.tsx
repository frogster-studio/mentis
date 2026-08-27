import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text } from "react-native";
import type { IconName } from "@/components/ui/icon-name";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, CONTROL_ICON_SIZE, PRESSED, RADIUS } from "@/theme/tokens";

export interface QuietButtonProps {
  onPress: () => void;
  disabled: boolean;
  layout: "block" | "circle";
  label: string | null;
  icon: IconName | null;
  accessibilityLabel: string | null;
}

export const QuietButton = ({
  onPress,
  disabled,
  layout,
  label,
  icon,
  accessibilityLabel,
}: QuietButtonProps) => {
  const color = disabled ? COLORS.inkMuted : COLORS.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label ?? accessibilityLabel ?? undefined}
      style={({ pressed }) => [styles.face, styles[layout], pressed && styles.pressed]}
    >
      {layout === "circle" ? (
        <MaterialIcons name={icon ?? undefined} size={CONTROL_ICON_SIZE} color={color} />
      ) : (
        <Text style={[styles.label, { color }]}>{label}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  face: {
    height: CONTROL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: COLORS.quiet,
    borderRadius: RADIUS.base,
    borderCurve: "continuous",
  },
  block: { alignSelf: "stretch" },
  circle: { width: CONTROL_HEIGHT, paddingHorizontal: 0, borderRadius: RADIUS.round },
  pressed: PRESSED,
  label: {
    ...TEXT.label,
    userSelect: "none",
  },
});
