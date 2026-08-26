// Category colours arrive as #RRGGBB data, so every derived tone is computed, never stored.

import { COLORS } from "@/theme/tokens";

const WASH_ALPHA = 0x38;
const SHADE_LIGHTNESS = 0.46;

export function categoryWash(color: string): string {
  return `${color}${WASH_ALPHA.toString(16)}`;
}

// The wash flattened onto the paper, for surfaces that need it opaque.
export function categoryWashSolid(color: string): string {
  const wash = rgbOf(color);
  const paper = rgbOf(COLORS.background);
  const mixed = wash.map((channel, i) =>
    Math.round(channel * (WASH_ALPHA / 255) + paper[i] * (1 - WASH_ALPHA / 255)),
  );
  return `rgb(${mixed.join(", ")})`;
}

export function categoryShade(color: string, alpha: number): string {
  const [hue, saturation, lightness] = rgbToHsl(rgbOf(color));
  const shaded = hslToRgb([hue, saturation, lightness * SHADE_LIGHTNESS]);
  return `rgba(${shaded.join(", ")}, ${alpha})`;
}

// An unparseable colour degrades to the neutral grey rather than an rgb(NaN) crash.
function rgbOf(color: string): number[] {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  const hex = match ? match[1] : COLORS.neutral.slice(1);
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function rgbToHsl([r, g, b]: number[]): number[] {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const delta = max - min;
  const lightness = (max + min) / 2;
  if (delta === 0) {
    return [0, 0, lightness];
  }
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const channels = [r / 255, g / 255, b / 255];
  const peak = channels.indexOf(max);
  const hue =
    60 *
    (peak === 0
      ? ((channels[1] - channels[2]) / delta + 6) % 6
      : peak === 1
        ? (channels[2] - channels[0]) / delta + 2
        : (channels[0] - channels[1]) / delta + 4);
  return [hue, saturation, lightness];
}

function hslToRgb([hue, saturation, lightness]: number[]): number[] {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = lightness - chroma / 2;
  const sector = Math.floor(hue / 60) % 6;
  const points = [
    [chroma, secondary, 0],
    [secondary, chroma, 0],
    [0, chroma, secondary],
    [0, secondary, chroma],
    [secondary, 0, chroma],
    [chroma, 0, secondary],
  ][sector];
  return points.map((point) => Math.round((point + base) * 255));
}
