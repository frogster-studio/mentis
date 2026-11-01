import { StyleSheet, Text, View } from "react-native";
import { AnecdoteDots } from "@/components/anecdote/anecdote-dots";
import { ANECDOTE_LABEL } from "@/features/anecdote/constants";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

export interface AnecdoteFooterProps {
  position: number;
  total: number;
}

export const AnecdoteFooter = ({ position, total }: AnecdoteFooterProps) => {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{ANECDOTE_LABEL}</Text>
      <AnecdoteDots position={position} total={total} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: SPACE.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.stroke,
  },
  label: { ...TEXT.anecdoteLabel, color: COLORS.inkMuted, textTransform: "uppercase" },
});
