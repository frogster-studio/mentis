import { StyleSheet, View } from "react-native";
import { ANECDOTE_TEXT_ZONE_MIN_HEIGHT } from "@/components/anecdote/anecdote-content";
import { AnecdoteFooter } from "@/components/anecdote/anecdote-footer";
import { Skeleton } from "@/components/ui/skeleton";
import { ANECDOTE_COUNT } from "@/features/anecdote/constants";
import { TEXT } from "@/theme/text";
import { RADIUS } from "@/theme/tokens";

const SHORT_LINE_WIDTH = "60%";

// The card's final structure: only the text is pending, so the footer is drawn for real.
export const AnecdoteSkeleton = () => {
  return (
    <>
      <View style={styles.textZone}>
        <Skeleton style={styles.line} />
        <Skeleton style={styles.line} />
        <Skeleton style={[styles.line, styles.shortLine]} />
      </View>
      <AnecdoteFooter position={0} total={ANECDOTE_COUNT} />
    </>
  );
};

// A bar as tall as the glyphs, centred in the line it stands in for.
function lineBar(text: { fontSize: number; lineHeight: number }) {
  return {
    height: text.fontSize,
    marginVertical: (text.lineHeight - text.fontSize) / 2,
    borderRadius: RADIUS.sm,
  };
}

const styles = StyleSheet.create({
  textZone: { minHeight: ANECDOTE_TEXT_ZONE_MIN_HEIGHT },
  line: lineBar(TEXT.anecdote),
  shortLine: { width: SHORT_LINE_WIDTH },
});
