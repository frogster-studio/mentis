export type Hsv = { hue: number; saturation: number; value: number };

const HEX_DIGITS = /^#?([0-9a-f]{6})$/i;

// The contract stores lowercase #rrggbb, so whatever the Editor types is folded into that shape.
export function hexOf(text: string): string | null {
  const match = HEX_DIGITS.exec(text.trim());
  return match === null ? null : `#${match[1].toLowerCase()}`;
}

export function hsvOf(hex: string): Hsv | null {
  const normalized = hexOf(hex);
  if (normalized === null) {
    return null;
  }
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const chroma = max - min;
  let hue = 0;
  if (chroma > 0) {
    if (max === red) {
      hue = ((green - blue) / chroma) % 6;
    } else if (max === green) {
      hue = (blue - red) / chroma + 2;
    } else {
      hue = (red - green) / chroma + 4;
    }
    hue = (hue * 60 + 360) % 360;
  }
  return { hue, saturation: max === 0 ? 0 : chroma / max, value: max };
}

export function hexOfHsv({ hue, saturation, value }: Hsv): string {
  const chroma = value * saturation;
  const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = value - chroma;
  const sector = Math.floor(hue / 60) % 6;
  const [red, green, blue] = [
    [chroma, secondary, 0],
    [secondary, chroma, 0],
    [0, chroma, secondary],
    [0, secondary, chroma],
    [secondary, 0, chroma],
    [chroma, 0, secondary],
  ][sector];
  return `#${[red, green, blue]
    .map((channel) =>
      Math.round((channel + base) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
