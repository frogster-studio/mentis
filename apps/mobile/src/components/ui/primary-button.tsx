import { Pressable, StyleSheet, Text } from "react-native";
import { COLORS } from "@/utils/colors";

export type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
};

export function PrimaryButton({ label, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: COLORS.fillOpposite,
    fontSize: 16,
    fontWeight: "bold",
  },
});
