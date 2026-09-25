import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { QuietButton } from "@/components/ui/quiet-button";
import { ALL_SCREEN_EDGES, ScreenContainer } from "@/components/ui/screen-container";
import { GUTTER, SPACE } from "@/theme/tokens";

export interface PlayFrameProps {
  quitLabel: string;
  onQuit: () => void;
}

// Nothing is under way yet, so the quit control leaves straight away — no confirmation.
export const PlayFrame = ({ quitLabel, onQuit, children }: PropsWithChildren<PlayFrameProps>) => {
  return (
    <ScreenContainer edges={ALL_SCREEN_EDGES} backdropColor={null}>
      <View style={styles.header}>
        <QuietButton
          layout="circle"
          label={null}
          icon="close"
          accessibilityLabel={quitLabel}
          onPress={onQuit}
          disabled={false}
        />
      </View>
      {children}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.sm,
  },
});
