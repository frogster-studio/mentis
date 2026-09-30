import { StyleSheet, Text } from "react-native";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

export interface HistorySectionHeaderProps {
  title: string;
}

export const HistorySectionHeader = ({ title }: HistorySectionHeaderProps) => {
  return <Text style={styles.title}>{title}</Text>;
};

const styles = StyleSheet.create({
  title: {
    ...TEXT.caption,
    color: COLORS.ink,
    opacity: 0.6,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.xs,
    marginLeft: SPACE.xs,
  },
});
