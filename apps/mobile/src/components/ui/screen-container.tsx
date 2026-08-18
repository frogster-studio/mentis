import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/theme/tokens";

// Desktop web must not stretch edge-to-edge; on phones the cap never engages.
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
