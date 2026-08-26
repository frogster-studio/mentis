import { StyleSheet, Text } from "react-native";
import { Squircle } from "@/components/ui/squircle";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

// The lower half of the card the AppHeader opens: it rides the screen, the greeting row does not.
export function ScreenTitleCard({ title }: { title: string }) {
  return (
    <Squircle radius={RADIUS.base} corners="bottom" color={COLORS.card} style={styles.card}>
      <Text style={styles.title}>{title}</Text>
    </Squircle>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: GUTTER,
    paddingTop: SPACE.xxl,
    paddingBottom: SPACE.lg,
    paddingHorizontal: SPACE.lg,
  },
  title: {
    ...TEXT.display,
    color: COLORS.ink,
  },
});
