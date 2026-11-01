import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { TEXT } from "@/theme/text";
import { RADIUS } from "@/theme/tokens";

const SHORT_LINE_WIDTH = "60%";

export const AnecdoteSkeleton = () => {
  return (
    <View>
      <Skeleton style={styles.line} />
      <Skeleton style={styles.line} />
      <Skeleton style={[styles.line, styles.shortLine]} />
    </View>
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
  line: lineBar(TEXT.body),
  shortLine: { width: SHORT_LINE_WIDTH },
});
