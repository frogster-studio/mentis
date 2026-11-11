import { Image } from "expo-image";
import { useEffect, useEffectEvent, useState } from "react";
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import Animated, { css } from "react-native-reanimated";
import { useReduceMotion } from "@/components/ui/use-reduce-motion";
import { ANECDOTE_FADE_MS, CLOSE_ANECDOTE_IMAGE_LABEL } from "@/features/anecdote/constants";
import { ANECDOTE_IMAGE_CACHE_POLICY } from "@/features/anecdote/image-cache";
import { anecdoteImageOverlaySize } from "@/features/anecdote/image-overlay-size";
import { COLORS, RADIUS } from "@/theme/tokens";

const SLIDE_MS = 300;

const FADE_IN = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const FADE_OUT = css.keyframes({ from: { opacity: 1 }, to: { opacity: 0 } });

// The scrim stands alone while the image loads, so the image only ever arrives whole.
type Phase = "loading" | "shown" | "hiding" | "leaving";

export interface AnecdoteImageOverlayProps {
  imageUrl: string;
  onClosed: () => void;
}

export const AnecdoteImageOverlay = ({ imageUrl, onClosed }: AnecdoteImageOverlayProps) => {
  const [phase, setPhase] = useState<Phase>("loading");
  const reduceMotion = useReduceMotion();
  const window = useWindowDimensions();
  const size = anecdoteImageOverlaySize(window);
  const belowScreen = (window.height + size.height) / 2;
  const imageExitMs = reduceMotion ? ANECDOTE_FADE_MS : SLIDE_MS;
  const notifyClosed = useEffectEvent(onClosed);

  useEffect(() => {
    if (phase === "hiding") {
      const timeout = setTimeout(() => setPhase("leaving"), imageExitMs);
      return () => clearTimeout(timeout);
    }
    if (phase === "leaving") {
      const timeout = setTimeout(notifyClosed, ANECDOTE_FADE_MS);
      return () => clearTimeout(timeout);
    }
  }, [phase, imageExitMs]);

  const close = () =>
    setPhase((current) =>
      current === "shown" ? "hiding" : current === "loading" ? "leaving" : current,
    );

  const imageMotion = {
    loading: styles.hidden,
    shown: reduceMotion
      ? styles.fadeIn
      : [styles.slideUp, { animationName: slide(belowScreen, 0) }],
    hiding: reduceMotion
      ? styles.fadeOut
      : [styles.slideDown, { animationName: slide(0, belowScreen) }],
    leaving: styles.hidden,
  }[phase];

  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      <Animated.View style={[styles.scrim, phase === "leaving" ? styles.fadeOut : styles.fadeIn]}>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={CLOSE_ANECDOTE_IMAGE_LABEL}
          style={styles.fill}
        />
      </Animated.View>
      <View style={styles.centre}>
        <Animated.View style={[size, imageMotion]}>
          <FastSquircleView style={styles.frame}>
            <Image
              source={imageUrl}
              cachePolicy={ANECDOTE_IMAGE_CACHE_POLICY}
              contentFit="cover"
              style={styles.fill}
              onLoad={() => setPhase((current) => (current === "loading" ? "shown" : current))}
              onError={() => setPhase((current) => (current === "loading" ? "leaving" : current))}
            />
          </FastSquircleView>
        </Animated.View>
      </View>
    </Modal>
  );
};

function slide(fromY: number, toY: number) {
  return {
    from: { transform: [{ translateY: fromY }] },
    to: { transform: [{ translateY: toY }] },
  };
}

const styles = css.create({
  fill: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: COLORS.scrim },
  centre: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "box-none",
  },
  frame: { flex: 1, borderRadius: RADIUS.base, overflow: "hidden" },
  hidden: { opacity: 0 },
  fadeIn: {
    animationName: FADE_IN,
    animationDuration: ANECDOTE_FADE_MS,
    animationTimingFunction: "ease-out",
  },
  fadeOut: {
    animationName: FADE_OUT,
    animationDuration: ANECDOTE_FADE_MS,
    animationTimingFunction: "ease-in",
    animationFillMode: "forwards",
  },
  slideUp: { animationDuration: SLIDE_MS, animationTimingFunction: "ease-out" },
  slideDown: {
    animationDuration: SLIDE_MS,
    animationTimingFunction: "ease-in",
    animationFillMode: "forwards",
  },
});
