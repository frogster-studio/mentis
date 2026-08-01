import { Pressable, StyleSheet, Text } from "react-native";
import { COLORS } from "@/utils/colors";

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
    backgroundColor: COLORS.panel,
    borderColor: COLORS.strokeDefault,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  name: {
    color: COLORS.fill,
    fontSize: 18,
    fontWeight: "bold",
  },
});
