import GLYPHMAP from "@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialIcons.json";

const CODEPOINTS: Record<string, number> = GLYPHMAP;
const ICON_NAMES = Object.keys(CODEPOINTS);
const SUGGESTION_LIMIT = 8;

export function isIconName(name: string): boolean {
  return Object.hasOwn(CODEPOINTS, name);
}

// The webfont carries the glyphs at the glyphmap's own codepoints, with no ligature to type instead.
export function iconGlyph(name: string): string {
  const codepoint = CODEPOINTS[name];
  return codepoint === undefined ? "" : String.fromCodePoint(codepoint);
}

// Names starting with what was typed come first, so "movie" outranks "photo-camera" for "mov".
export function suggestIcons(query: string): string[] {
  const needle = query.trim().toLowerCase();
  return ICON_NAMES.filter((name) => name.includes(needle))
    .sort(
      (left, right) => left.indexOf(needle) - right.indexOf(needle) || left.length - right.length,
    )
    .slice(0, SUGGESTION_LIMIT);
}
