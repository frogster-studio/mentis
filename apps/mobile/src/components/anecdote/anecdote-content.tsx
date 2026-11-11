import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, View } from "react-native";
import { AnecdoteFooter } from "@/components/anecdote/anecdote-footer";
import { EmphasizedText } from "@/components/ui/emphasized-text";
import { DISMISS_ANECDOTE_LABEL, OPEN_ANECDOTE_IMAGE_LABEL } from "@/features/anecdote/constants";
import type { Anecdote } from "@/features/anecdote/day-set";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";

const ICON_SIZE = 20;

const TEXT_ZONE_MIN_LINES = 4;

// Every card holds four lines, so the pile keeps one height whatever the text.
export const ANECDOTE_TEXT_ZONE_MIN_HEIGHT = TEXT_ZONE_MIN_LINES * TEXT.anecdote.lineHeight;

export interface AnecdoteContentProps {
  anecdote: Anecdote;
  position: number;
  total: number;
  onDismiss: () => void;
  onOpenImage: (imageUrl: string) => void;
}

export const AnecdoteContent = ({
  anecdote,
  position,
  total,
  onDismiss,
  onOpenImage,
}: AnecdoteContentProps) => {
  const { imageUrl } = anecdote;
  return (
    <>
      <View style={styles.body}>
        <View style={styles.textZone}>
          <EmphasizedText text={anecdote.text} />
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={onDismiss}
            accessibilityLabel={DISMISS_ANECDOTE_LABEL}
            hitSlop={SPACE.sm}
            style={({ pressed }) => pressed && PRESSED}
          >
            <MaterialIcons name="close" size={ICON_SIZE} color={COLORS.inkMuted} />
          </Pressable>
          {imageUrl === null ? null : (
            <Pressable
              onPress={() => onOpenImage(imageUrl)}
              accessibilityLabel={OPEN_ANECDOTE_IMAGE_LABEL}
              hitSlop={SPACE.sm}
              style={({ pressed }) => pressed && PRESSED}
            >
              <MaterialIcons name="photo" size={ICON_SIZE} color={COLORS.inkMuted} />
            </Pressable>
          )}
        </View>
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
  actions: { alignSelf: "stretch", justifyContent: "space-between" },
});
