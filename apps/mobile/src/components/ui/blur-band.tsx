import { BlurView } from "expo-blur";
import type { PropsWithChildren } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { COLORS } from "@/theme/tokens";

const BLUR_INTENSITY = 40;
// Android below 12 renders no blur, so the wash goes opaque and the band degrades flat.
const WASH_OPACITY = Platform.OS === "android" && Number(Platform.Version) < 31 ? 1 : 0.7;

export interface BlurBandProps {
  edge: "top" | "bottom";
}

export const BlurBand = ({ children, edge }: PropsWithChildren<BlurBandProps>) => {
  return (
    <View style={[styles.overlay, styles[edge]]}>
      <BlurView
        intensity={BLUR_INTENSITY}
        tint="light"
        blurMethod="dimezisBlurViewSdk31Plus"
        style={styles.band}
      >
        {/* Keeps the band's content legible against whatever scrolls under the blur. */}
        <View style={[StyleSheet.absoluteFill, styles.wash]} />
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  top: { top: 0 },
  bottom: { bottom: 0 },
  band: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    pointerEvents: "box-none",
  },
  wash: {
    backgroundColor: COLORS.background,
    opacity: WASH_OPACITY,
    pointerEvents: "none",
  },
});
