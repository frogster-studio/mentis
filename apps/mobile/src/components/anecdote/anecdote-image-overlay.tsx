import { Image } from "expo-image";
import { useEffect, useEffectEvent, useState } from "react";
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { css, cubicBezier } from "react-native-reanimated";
import {
  ANECDOTE_IMAGE_FRAME_PADDING,
  AnecdoteImageFrame,
} from "@/components/anecdote/anecdote-image-frame";
import { useReduceMotion } from "@/components/ui/use-reduce-motion";
import { ANECDOTE_FADE_MS, CLOSE_ANECDOTE_IMAGE_LABEL } from "@/features/anecdote/constants";
import { ANECDOTE_IMAGE_CACHE_POLICY } from "@/features/anecdote/image-cache";
import { anecdoteImageOverlaySize } from "@/features/anecdote/image-overlay-size";
import { COLORS } from "@/theme/tokens";

const ENTER_MS = 480;
const EXIT_MS = 280;

// A soft overshoot on the way in, a plain ease-in on the way out.
const ENTER_EASING = cubicBezier(0.2, 1.15, 0.4, 1);
const EXIT_EASING = cubicBezier(0.5, 0, 0.75, 0);

const FADE_IN = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const FADE_OUT = css.keyframes({ from: { opacity: 1 }, to: { opacity: 0 } });

// The scrim stands alone while the image loads, so the image only ever arrives whole.
type Phase = "loading" | "shown" | "hiding" | "leaving";

export interface AnecdoteImageOverlayProps {
  imageUrl: string;
  onClosing: () => void;
  onClosed: () => void;
}

export const AnecdoteImageOverlay = ({
  imageUrl,
  onClosing,
  onClosed,
}: AnecdoteImageOverlayProps) => {
  const [phase, setPhase] = useState<Phase>("loading");
  const reduceMotion = useReduceMotion();
  const window = useWindowDimensions();
  const imageSize = anecdoteImageOverlaySize(window);
  const frameSize = {
    width: imageSize.width + 2 * ANECDOTE_IMAGE_FRAME_PADDING,
    height: imageSize.height + 2 * ANECDOTE_IMAGE_FRAME_PADDING,
  };
  const belowScreen = (window.height + frameSize.height) / 2;
  const imageExitMs = reduceMotion ? ANECDOTE_FADE_MS : EXIT_MS;
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

  const close = () => {
    if (phase === "shown") {
      onClosing();
      setPhase("hiding");
    } else if (phase === "loading") {
      onClosing();
      setPhase("leaving");
    }
  };

  const imageMotion = {
    loading: styles.hidden,
    shown: reduceMotion
      ? styles.fadeIn
      : [styles.enter, { animationName: enterKeyframes(belowScreen) }],
    hiding: reduceMotion
      ? styles.fadeOut
      : [styles.exit, { animationName: exitKeyframes(belowScreen) }],
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
        <Animated.View style={[frameSize, imageMotion]}>
          <AnecdoteImageFrame isThumbnail={false}>
            <Image
              source={imageUrl}
              cachePolicy={ANECDOTE_IMAGE_CACHE_POLICY}
              contentFit="cover"
              style={styles.fill}
              onLoad={() => setPhase((current) => (current === "loading" ? "shown" : current))}
              onError={() => setPhase((current) => (current === "loading" ? "leaving" : current))}
            />
          </AnecdoteImageFrame>
        </Animated.View>
      </View>
    </Modal>
  );
};

function enterKeyframes(belowScreen: number) {
  return {
    from: { transform: [{ translateY: belowScreen }, { rotate: "12deg" }, { scale: 0.9 }] },
    to: { transform: [{ translateY: 0 }, { rotate: "0deg" }, { scale: 1 }] },
  };
}

function exitKeyframes(belowScreen: number) {
  return {
    from: { transform: [{ translateY: 0 }, { rotate: "0deg" }] },
    to: { transform: [{ translateY: belowScreen }, { rotate: "-10deg" }] },
  };
}

const styles = css.create({
  fill: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: COLORS.scrimDeep },
  centre: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "box-none",
  },
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
  enter: { animationDuration: ENTER_MS, animationTimingFunction: ENTER_EASING },
  exit: {
    animationDuration: EXIT_MS,
    animationTimingFunction: EXIT_EASING,
    animationFillMode: "forwards",
  },
});
