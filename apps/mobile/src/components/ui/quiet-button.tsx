import type { LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, PRESSED, RADIUS } from "@/theme/tokens";

type QuietButtonBaseProps = {
  onPress: () => void;
  disabled?: boolean;
};

export type QuietButtonProps = QuietButtonBaseProps &
  (
    | { layout?: "block" | "flex"; label: string }
    | { layout: "circle"; icon: LucideIcon; accessibilityLabel: string }
  );

export function QuietButton(props: QuietButtonProps) {
  const { onPress, disabled = false } = props;
  const color = disabled ? COLORS.inkMuted : COLORS.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={props.layout === "circle" ? props.accessibilityLabel : props.label}
      style={({ pressed }) => [
        styles.face,
        styles[props.layout ?? "block"],
        pressed && styles.pressed,
      ]}
    >
      {props.layout === "circle" ? (
        <props.icon size={20} color={color} />
      ) : (
        <Text style={[styles.label, { color }]}>{props.label}</Text>
      )}
    </Pressable>
  );
}

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
  flex: { flex: 1 },
  circle: { width: CONTROL_HEIGHT, paddingHorizontal: 0, borderRadius: RADIUS.round },
  pressed: PRESSED,
  label: {
    ...TEXT.label,
    userSelect: "none",
  },
});
