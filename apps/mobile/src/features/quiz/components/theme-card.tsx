import { Pressable, StyleSheet, Text } from "react-native";
import { COLORS, PRESSED, RADIUS } from "@/theme/tokens";

export type ThemeCardProps = {
  name: string;
  onPress: () => void;
};

export function ThemeCard({ name, onPress }: ThemeCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.name}>{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.quiet,
    borderColor: COLORS.stroke,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  pressed: PRESSED,
  name: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "bold",
  },
});
