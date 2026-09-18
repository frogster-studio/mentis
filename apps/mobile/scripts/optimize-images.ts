import { mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";

const ASSETS_DIR = join(__dirname, "../assets");
const ORIGINALS_DIR = join(ASSETS_DIR, "originals");
const IMAGES_DIR = join(ASSETS_DIR, "images");

// The widest phone the app targets is 430 dp, so a 3x export never exceeds this width.
const MAX_WIDTH = 430 * 3;

const WEBP_OPTIONS = { quality: 85, alphaQuality: 100, effort: 6, smartSubsample: true };

const listPngs = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return listPngs(path);
    }
    return entry.name.endsWith(".png") ? [path] : [];
  });

const kilobytes = (path: string): string => `${Math.round(statSync(path).size / 1024)}K`;

const optimize = async (original: string) => {
  const relativePath = relative(ORIGINALS_DIR, original);
  const output = join(IMAGES_DIR, relativePath.replace(/\.png$/, ".webp"));
  const { width } = await sharp(original).metadata();
  if (width === undefined || width > MAX_WIDTH) {
    throw new Error(`${relativePath} is ${width}px wide — export it at displayed dp × 3`);
  }
  mkdirSync(dirname(output), { recursive: true });
  await sharp(original).webp(WEBP_OPTIONS).toFile(output);
  console.log(`${relativePath}  ${kilobytes(original)} → ${kilobytes(output)}`);
};

const originals = listPngs(ORIGINALS_DIR);
if (originals.length === 0) {
  throw new Error(`No PNG under ${ORIGINALS_DIR} — export from Figma there first`);
}
await Promise.all(originals.map(optimize));
