import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import {
  MARK_RAYS_PATH,
  MARK_STARBURST_PATH,
  MARK_VIEWBOX_SIZE,
} from "@/components/logo-mark-paths";
import { COLORS } from "@/theme/tokens";

const ASSETS_DIR = join(__dirname, "../assets");

const FULL_MARK = [MARK_RAYS_PATH, MARK_STARBURST_PATH];
const STARBURST_ONLY = [MARK_STARBURST_PATH];

// Android's mask can cut to a circle spanning 66 of the icon canvas's 108 units.
const ANDROID_SAFE_RADIUS = 66 / 108 / 2;
// How far each drawing reaches from its box centre, as a share of the box side.
const FULL_MARK_REACH = 0.6784;
const STARBURST_REACH = 0.4965;

const ANDROID_MARK_SHARE = ANDROID_SAFE_RADIUS / FULL_MARK_REACH;
const ANDROID_STARBURST_SHARE = ANDROID_SAFE_RADIUS / STARBURST_REACH;
const IOS_MARK_SHARE = 0.65;

type Surface = {
  output: string;
  canvas: number;
  paths: string[];
  color: string;
  markShare: number;
  background?: string;
};

const SURFACES: Surface[] = [
  {
    output: "images/icon.png",
    canvas: 1024,
    paths: FULL_MARK,
    color: COLORS.primary,
    markShare: IOS_MARK_SHARE,
    background: COLORS.card,
  },
  // Icon Composer paints the white plate itself, so its layer ships the bare Mark.
  {
    output: "expo.icon/Assets/mark.svg",
    canvas: 1024,
    paths: FULL_MARK,
    color: COLORS.primary,
    markShare: IOS_MARK_SHARE,
  },
  {
    output: "images/android-icon-foreground.png",
    canvas: 1024,
    paths: FULL_MARK,
    color: COLORS.primary,
    markShare: ANDROID_MARK_SHARE,
  },
  {
    output: "images/android-icon-monochrome.png",
    canvas: 1024,
    paths: STARBURST_ONLY,
    color: COLORS.ink,
    markShare: ANDROID_STARBURST_SHARE,
  },
  {
    output: "images/splash-icon.png",
    canvas: 384,
    paths: FULL_MARK,
    color: COLORS.primary,
    markShare: 1,
  },
  {
    output: "images/favicon.png",
    canvas: 64,
    paths: STARBURST_ONLY,
    color: COLORS.primary,
    markShare: 1,
  },
];

function markSvg({ canvas, paths, color, markShare, background }: Surface): string {
  const drawn = canvas * markShare;
  const scale = drawn / MARK_VIEWBOX_SIZE;
  const inset = (canvas - drawn) / 2;
  const plate = background
    ? `<rect width="${canvas}" height="${canvas}" fill="${background}"/>`
    : "";
  const marks = paths.map((path) => `<path fill="${color}" d="${path}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">${plate}<g transform="translate(${inset} ${inset}) scale(${scale})">${marks}</g></svg>`;
}

for (const surface of SURFACES) {
  const svg = markSvg(surface);
  const rendered = surface.output.endsWith(".svg")
    ? svg
    : new Resvg(svg, { fitTo: { mode: "original" } }).render().asPng();
  writeFileSync(join(ASSETS_DIR, surface.output), rendered);
  console.log(surface.output);
}
