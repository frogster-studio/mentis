import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView, type SafeAreaViewProps } from "react-native-safe-area-context";
import { PaperBackground } from "@/components/ui/paper-background";
import { COLORS } from "@/theme/tokens";

// Desktop web must not stretch edge-to-edge; on phones the cap never engages.
export const MAX_CONTENT_WIDTH = 480;

// The AppHeader and the tab bar spend the vertical insets, so a tab screen must never spend them twice.
export const TAB_SCREEN_EDGES = ["left", "right"] as const;

export type ScreenContainerProps = {
  children: ReactNode;
  edges?: SafeAreaViewProps["edges"];
  background?: string;
};

export function ScreenContainer({ children, edges, background }: ScreenContainerProps) {
  return (
    <View style={[styles.screen, background ? { backgroundColor: background } : null]}>
      {/* The grid belongs to the paper; a screen that washes itself another colour drops it. */}
      {background ? null : <PaperBackground />}
      <SafeAreaView style={styles.content} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // A wrapper under the safe area shifts KeyboardAvoidingView's frame and covers the input on iOS.
  content: {
    flex: 1,
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
});
