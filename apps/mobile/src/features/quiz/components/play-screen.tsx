import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { ScreenContainer } from "@/components/ui/screen-container";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

export type PlayScreenProps = {
  questionText: string;
  header: ReactNode;
  footer: ReactNode;
};

export function PlayScreen({ questionText, header, footer }: PlayScreenProps) {
  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {header}
        <ScrollView style={styles.flex} contentContainerStyle={styles.questionContent}>
          <Text style={styles.questionText}>{questionText}</Text>
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  questionContent: {
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.xxl,
    paddingBottom: SPACE.xl,
  },
  questionText: {
    ...TEXT.question,
    color: COLORS.ink,
  },
});
