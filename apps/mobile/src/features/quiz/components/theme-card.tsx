import { StyleSheet, Text } from "react-native";
import { Card } from "@/components/ui/card";
import { TEXT } from "@/theme/text";
import { COLORS } from "@/theme/tokens";

export type ThemeCardProps = {
  name: string;
  onPress: () => void;
};

export function ThemeCard({ name, onPress }: ThemeCardProps) {
  return (
    <Card onPress={onPress}>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  name: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
    textAlign: "center",
  },
});
