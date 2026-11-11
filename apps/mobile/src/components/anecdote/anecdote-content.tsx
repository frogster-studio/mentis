import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, View } from "react-native";
import { AnecdoteFooter } from "@/components/anecdote/anecdote-footer";
import { EmphasizedText } from "@/components/ui/emphasized-text";
import { DISMISS_ANECDOTE_LABEL } from "@/features/anecdote/constants";
import type { Anecdote } from "@/features/anecdote/day-set";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";

const DISMISS_ICON_SIZE = 20;

const TEXT_ZONE_MIN_LINES = 4;

// Every card holds four lines, so the pile keeps one height whatever the text.
export const ANECDOTE_TEXT_ZONE_MIN_HEIGHT = TEXT_ZONE_MIN_LINES * TEXT.anecdote.lineHeight;

export interface AnecdoteContentProps {
  anecdote: Anecdote;
  position: number;
  total: number;
  onDismiss: () => void;
}

export const AnecdoteContent = ({ anecdote, position, total, onDismiss }: AnecdoteContentProps) => {
  return (
    <>
      <View style={styles.body}>
        <View style={styles.textZone}>
          <EmphasizedText text={anecdote.text} />
        </View>
        <Pressable
          onPress={onDismiss}
          accessibilityLabel={DISMISS_ANECDOTE_LABEL}
          hitSlop={SPACE.sm}
          style={({ pressed }) => pressed && PRESSED}
        >
          <MaterialIcons name="close" size={DISMISS_ICON_SIZE} color={COLORS.inkMuted} />
        </Pressable>
      </View>
      <AnecdoteFooter position={position} total={total} />
    </>
  );
};

const styles = StyleSheet.create({
  body: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE.sm,
    minHeight: ANECDOTE_TEXT_ZONE_MIN_HEIGHT,
  },
  textZone: { flex: 1 },
});
