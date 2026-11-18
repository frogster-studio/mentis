import { Image } from "expo-image";
import { useState } from "react";
import { Pressable } from "react-native";
import Animated, { css } from "react-native-reanimated";
import {
  ANECDOTE_THUMBNAIL_FRAME_PADDING,
  AnecdoteImageFrame,
} from "@/components/anecdote/anecdote-image-frame";
import { useReduceMotion } from "@/components/ui/use-reduce-motion";
import { OPEN_ANECDOTE_IMAGE_LABEL } from "@/features/anecdote/constants";
import { ANECDOTE_IMAGE_CACHE_POLICY } from "@/features/anecdote/image-cache";
import { ANECDOTE_IMAGE_ASPECT_RATIO } from "@/features/anecdote/image-overlay-size";
import { SPACE } from "@/theme/tokens";

const THUMBNAIL_IMAGE_WIDTH = 56;

export const ANECDOTE_THUMBNAIL_WIDTH =
  THUMBNAIL_IMAGE_WIDTH + 2 * ANECDOTE_THUMBNAIL_FRAME_PADDING;
const THUMBNAIL_HEIGHT =
  THUMBNAIL_IMAGE_WIDTH / ANECDOTE_IMAGE_ASPECT_RATIO + 2 * ANECDOTE_THUMBNAIL_FRAME_PADDING;
const HIDDEN_HEIGHT = THUMBNAIL_HEIGHT / 4;
// The tilt lifts one corner, so the sink goes a step past the visible height.
const SINK_DEPTH = THUMBNAIL_HEIGHT - HIDDEN_HEIGHT + SPACE.sm;

const SINK_MS = 220;
const RISE_MS = 280;

const SINK = css.keyframes({
  from: { transform: [{ translateY: 0 }] },
  to: { transform: [{ translateY: SINK_DEPTH }] },
});
const RISE = css.keyframes({
  from: { transform: [{ translateY: SINK_DEPTH }] },
  to: { transform: [{ translateY: 0 }] },
});

export interface AnecdoteImageThumbnailProps {
  imageUrl: string;
  isImageOpen: boolean;
  onOpenImage: (imageUrl: string) => void;
}

export const AnecdoteImageThumbnail = ({
  imageUrl,
  isImageOpen,
  onOpenImage,
}: AnecdoteImageThumbnailProps) => {
  const [wasOpened, setWasOpened] = useState(false);
  const reduceMotion = useReduceMotion();

  const open = () => {
    setWasOpened(true);
    onOpenImage(imageUrl);
  };

  const sunk = reduceMotion ? styles.hidden : styles.sink;
  const motion = isImageOpen ? sunk : wasOpened && !reduceMotion ? styles.rise : null;

  return (
    <Animated.View style={[styles.root, motion]}>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={OPEN_ANECDOTE_IMAGE_LABEL}
        style={styles.fill}
      >
        <AnecdoteImageFrame isThumbnail>
          <Image
            source={imageUrl}
            cachePolicy={ANECDOTE_IMAGE_CACHE_POLICY}
            contentFit="cover"
            style={styles.fill}
          />
        </AnecdoteImageFrame>
      </Pressable>
    </Animated.View>
  );
};

const styles = css.create({
  // A quarter of the thumbnail hangs below the card, which crops it.
  root: {
    position: "absolute",
    right: SPACE.lg,
    bottom: -HIDDEN_HEIGHT,
    width: ANECDOTE_THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
  },
  fill: { flex: 1 },
  hidden: { opacity: 0 },
  sink: {
    animationName: SINK,
    animationDuration: SINK_MS,
    animationTimingFunction: "ease-in",
    animationFillMode: "forwards",
  },
  rise: {
    animationName: RISE,
    animationDuration: RISE_MS,
    animationTimingFunction: "ease-out",
  },
});
