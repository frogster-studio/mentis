import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnecdoteDots } from "@/components/anecdote/anecdote-dots";
import { DISMISS_ANECDOTE_LABEL } from "@/features/anecdote/constants";
import type { Anecdote } from "@/features/anecdote/day-set";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";

const DISMISS_ICON_SIZE = 20;

export interface AnecdoteContentProps {
  anecdote: Anecdote;
  position: number;
  total: number;
  onDismiss: () => void;
}

export const AnecdoteContent = ({ anecdote, position, total, onDismiss }: AnecdoteContentProps) => {
  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.text}>{anecdote.text}</Text>
        <Pressable
          onPress={onDismiss}
          accessibilityLabel={DISMISS_ANECDOTE_LABEL}
          hitSlop={SPACE.sm}
          style={({ pressed }) => pressed && PRESSED}
        >
          <MaterialIcons name="close" size={DISMISS_ICON_SIZE} color={COLORS.inkMuted} />
        </Pressable>
      </View>
      <AnecdoteDots position={position} total={total} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: SPACE.md },
  body: { flexDirection: "row", alignItems: "flex-start", gap: SPACE.sm },
  text: { ...TEXT.body, flex: 1, color: COLORS.ink },
});
