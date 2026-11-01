import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { TextStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnecdoteFooter } from "@/components/anecdote/anecdote-footer";
import { DISMISS_ANECDOTE_LABEL } from "@/features/anecdote/constants";
import type { Anecdote } from "@/features/anecdote/day-set";
import { type AnecdoteTextSegment, anecdoteTextSegments } from "@/features/anecdote/text-segments";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";

const DISMISS_ICON_SIZE = 20;

// Every card holds four lines, so the pile keeps one height whatever the text.
const TEXT_ZONE_MIN_LINES = 4;

const EMPHASIS_TEXT = {
  regular: TEXT.anecdote,
  bold: TEXT.anecdoteBold,
  italic: TEXT.anecdoteItalic,
} as const satisfies Record<AnecdoteTextSegment["emphasis"], TextStyle>;

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
        <Text style={styles.text}>
          {anecdoteTextSegments(anecdote.text).map((segment, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: one text's segments never reorder.
            <Text key={index} style={EMPHASIS_TEXT[segment.emphasis]}>
              {segment.text}
            </Text>
          ))}
        </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: SPACE.sm },
  body: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE.sm,
    minHeight: TEXT_ZONE_MIN_LINES * TEXT.anecdote.lineHeight,
  },
  text: { ...TEXT.anecdote, flex: 1, color: COLORS.ink },
});
