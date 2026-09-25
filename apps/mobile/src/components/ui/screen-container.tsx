import type { PropsWithChildren } from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  SafeAreaView,
  type SafeAreaViewProps,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { PaperBackground } from "@/components/ui/paper-background";
import { COLORS, SPACE } from "@/theme/tokens";

// Desktop web must not stretch edge-to-edge; on phones the cap never engages.
export const MAX_CONTENT_WIDTH = 480;

// SafeAreaView's own default, written out so no screen inherits an edge set it never chose.
export const ALL_SCREEN_EDGES = ["top", "right", "bottom", "left"] as const;

// Apple's inset already holds room over the home indicator; Android's is the bare navigation bar.
const NAVIGATION_BAR_ROOM = Platform.OS === "android" ? SPACE.md : 0;

// Floating bottom chrome pads by this, so it never sits flat on the bar or the screen edge.
export function useBottomChromeGap(): number {
  return Math.max(useSafeAreaInsets().bottom + NAVIGATION_BAR_ROOM, SPACE.lg);
}

export interface ScreenContainerProps {
  edges: SafeAreaViewProps["edges"];
  // Painted flat over the whole paper but under the content — a translucent colour keeps the grid showing.
  backdropColor: string | null;
}

export const ScreenContainer = ({
  children,
  edges,
  backdropColor,
}: PropsWithChildren<ScreenContainerProps>) => {
  return (
    <View style={styles.screen}>
      <PaperBackground isDark={false} />
      {backdropColor ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: backdropColor }]} />
      ) : null}
      <SafeAreaView style={styles.content} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
};

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
