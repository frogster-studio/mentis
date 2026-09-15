import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { MARK_STARBURST_PATH, MARK_VIEWBOX_SIZE } from "@/components/logo-mark-paths";
import { COLORS } from "@/theme/tokens";

const ASSETS_DIR = join(__dirname, "../assets");
const APP_ICON_MARK = join(ASSETS_DIR, "app-icon/mark.svg");
const APP_ICON_BACKGROUND = join(ASSETS_DIR, "app-icon/background.svg");

const ICON_CANVAS = 1024;
// Android's mask can cut to a circle spanning 66 of the icon canvas's 108 units.
const ANDROID_SAFE_RADIUS = ICON_CANVAS * (66 / 108 / 2);

const SVG_OPEN_TAG = /<svg\b[^>]*>/;
const SVG_VIEWBOX = /viewBox="\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*"/;
const PAINT_ATTRIBUTE = /(fill|stroke)="(?!none")[^"]*"/g;
const PAINT_STYLE = /(fill|stroke):\s*(?!none)[^;"]+/g;

const readAppIconLayer = (source: string): string => {
  if (!existsSync(source)) {
    throw new Error(`Missing ${source} — export the app icon layers there first`);
  }
  const svg = readFileSync(source, "utf8");
  const viewBox = svg.match(SVG_VIEWBOX);
  if (!viewBox || viewBox[1] !== viewBox[2]) {
    throw new Error(`${source} needs a square viewBox starting at 0 0`);
  }
  return svg;
};

const layerInner = (svg: string): string =>
  svg.replace(SVG_OPEN_TAG, "").replace(/<\/svg>\s*$/, "");

const layerViewBoxSize = (svg: string): number => Number(svg.match(SVG_VIEWBOX)?.[1]);

const recolored = (svg: string, color: string): string =>
  svg.replace(PAINT_ATTRIBUTE, `$1="${color}"`).replace(PAINT_STYLE, `$1:${color}`);

const placed = (layer: string, scale: number): string => {
  const centre = ICON_CANVAS / 2;
  return `<g fill="none" transform="translate(${centre} ${centre}) scale(${scale}) translate(${-centre} ${-centre}) scale(${ICON_CANVAS / layerViewBoxSize(layer)})">${layerInner(layer)}</g>`;
};

const composeIcon = (plate: string | null, mark: string | null, markScale: number): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_CANVAS}" height="${ICON_CANVAS}" viewBox="0 0 ${ICON_CANVAS} ${ICON_CANVAS}">${plate ? placed(plate, 1) : ""}${mark ? placed(mark, markScale) : ""}</svg>`;

const renderPng = (svg: string): Buffer =>
  new Resvg(svg, { fitTo: { mode: "original" } }).render().asPng();

type MarkExtent = { reachFromCentre: number; left: number; top: number; side: number };

const measureMark = (svg: string): MarkExtent => {
  const { pixels, width } = new Resvg(svg, { fitTo: { mode: "original" } }).render();
  const centre = width / 2;
  let reachSquared = 0;
  let left = width;
  let top = width;
  let right = 0;
  let bottom = 0;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] === 0) {
      continue;
    }
    const pixel = (index - 3) / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const dx = x + 0.5 - centre;
    const dy = y + 0.5 - centre;
    reachSquared = Math.max(reachSquared, dx * dx + dy * dy);
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x + 1);
    bottom = Math.max(bottom, y + 1);
  }
  const side = Math.max(right - left, bottom - top);
  return {
    reachFromCentre: Math.sqrt(reachSquared),
    left: (left + right - side) / 2,
    top: (top + bottom - side) / 2,
    side,
  };
};

const croppedMark = (mark: string, extent: MarkExtent, canvas: number): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="${extent.left} ${extent.top} ${extent.side} ${extent.side}">${placed(mark, 1)}</svg>`;

const legacyMarkSvg = (canvas: number, paths: string[], color: string): string => {
  const scale = canvas / MARK_VIEWBOX_SIZE;
  const marks = paths.map((path) => `<path fill="${color}" d="${path}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}"><g transform="scale(${scale})">${marks}</g></svg>`;
};

const write = (output: string, content: Buffer | string) => {
  writeFileSync(join(ASSETS_DIR, output), content);
  console.log(output);
};

const mark = readAppIconLayer(APP_ICON_MARK);
const background = readAppIconLayer(APP_ICON_BACKGROUND);
const markExtent = measureMark(composeIcon(null, mark, 1));
const androidScale = Math.min(1, ANDROID_SAFE_RADIUS / markExtent.reachFromCentre);

write("images/icon.png", renderPng(composeIcon(background, mark, 1)));
write("images/android-icon-background.png", renderPng(composeIcon(background, null, 1)));
write("images/android-icon-foreground.png", renderPng(composeIcon(null, mark, androidScale)));
write(
  "images/android-icon-monochrome.png",
  renderPng(composeIcon(null, recolored(mark, COLORS.ink), androidScale)),
);
// Icon Composer paints the gradient plate itself, so its layer ships the bare mark.
write("expo.icon/Assets/mark.svg", mark);
write("images/splash-icon.png", renderPng(croppedMark(mark, markExtent, 384)));
write("images/favicon.png", renderPng(legacyMarkSvg(64, [MARK_STARBURST_PATH], COLORS.primary)));
