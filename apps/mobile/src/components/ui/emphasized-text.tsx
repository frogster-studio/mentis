import type { TextStyle } from "react-native";
import { StyleSheet, Text } from "react-native";
import { TEXT } from "@/theme/text";
import { COLORS } from "@/theme/tokens";
import { type EmphasisSegment, emphasisSegments } from "@/utils/emphasis-segments";

const EMPHASIS_TEXT = {
  regular: TEXT.anecdote,
  bold: TEXT.anecdoteBold,
  italic: TEXT.anecdoteItalic,
} as const satisfies Record<EmphasisSegment["emphasis"], TextStyle>;

export interface EmphasizedTextProps {
  text: string;
}

export const EmphasizedText = ({ text }: EmphasizedTextProps) => {
  return (
    <Text style={styles.text}>
      {emphasisSegments(text).map((segment, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: one text's segments never reorder.
        <Text key={index} style={EMPHASIS_TEXT[segment.emphasis]}>
          {segment.text}
        </Text>
      ))}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: { ...TEXT.anecdote, color: COLORS.ink },
});
