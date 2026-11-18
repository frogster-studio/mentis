import { MAX_CONTENT_WIDTH, SPACE } from "@/theme/tokens";

// The API stores every Anecdote Image at exactly 750×1024.
export const ANECDOTE_IMAGE_ASPECT_RATIO = 750 / 1024;

export const ANECDOTE_IMAGE_WINDOW_INSET = SPACE.xxl;

type Size = { width: number; height: number };

export function anecdoteImageOverlaySize(window: Size): Size {
  const widestFit = Math.min(window.width - 2 * ANECDOTE_IMAGE_WINDOW_INSET, MAX_CONTENT_WIDTH);
  const tallestFit = window.height - 2 * ANECDOTE_IMAGE_WINDOW_INSET;
  const width = Math.min(widestFit, tallestFit * ANECDOTE_IMAGE_ASPECT_RATIO);
  return { width, height: width / ANECDOTE_IMAGE_ASPECT_RATIO };
}
