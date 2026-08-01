import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/utils/colors";

// Desktop web must not stretch the UI edge-to-edge: every screen's content is
// capped at a phone-like width and centered. On phones the cap never engages.
const MAX_CONTENT_WIDTH = 480;

export type ScreenContainerProps = {
  children: ReactNode;
};

export function ScreenContainer({ children }: ScreenContainerProps) {
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.content}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  // The SafeAreaView must stay the direct parent of each screen's content:
  // KeyboardAvoidingView measures its frame relative to its parent chain, and an
  // extra wrapper below the safe area shifts that frame by the top inset,
  // making the keyboard cover the input by the same amount (seen on iOS).
  content: {
    flex: 1,
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
});
