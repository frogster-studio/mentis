import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";
import { gradient } from "@/utils/gradient";

export const ANECDOTE_IMAGE_FRAME_PADDING = SPACE.sm;
export const ANECDOTE_THUMBNAIL_FRAME_PADDING = SPACE.xxs;

const FRAME_SHADOW = `0px 12px 32px ${COLORS.ink}66`;

export interface AnecdoteImageFrameProps {
  isThumbnail: boolean;
}

export const AnecdoteImageFrame = ({
  children,
  isThumbnail,
}: PropsWithChildren<AnecdoteImageFrameProps>) => {
  return (
    <FastSquircleView
      style={[styles.frame, isThumbnail ? styles.thumbnailFrame : styles.fullFrame]}
    >
      <FastSquircleView
        style={[styles.photo, isThumbnail ? styles.thumbnailPhoto : styles.fullPhoto]}
      >
        {children}
      </FastSquircleView>
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    boxShadow: FRAME_SHADOW,
    ...gradient(`linear-gradient(to bottom, ${COLORS.face}, ${COLORS.background})`),
  },
  fullFrame: {
    padding: ANECDOTE_IMAGE_FRAME_PADDING,
    borderRadius: RADIUS.base,
    transform: [{ rotate: "-3deg" }],
  },
  thumbnailFrame: {
    padding: ANECDOTE_THUMBNAIL_FRAME_PADDING,
    borderRadius: RADIUS.sm,
    transform: [{ rotate: "-6deg" }],
  },
  photo: { flex: 1, overflow: "hidden" },
  fullPhoto: { borderRadius: RADIUS.base - ANECDOTE_IMAGE_FRAME_PADDING },
  thumbnailPhoto: { borderRadius: RADIUS.sm - ANECDOTE_THUMBNAIL_FRAME_PADDING },
});
