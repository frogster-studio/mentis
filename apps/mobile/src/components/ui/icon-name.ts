import GLYPHS from "@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialIcons.json";
import type MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";

export type IconName = ComponentProps<typeof MaterialIcons>["name"];

// The Community set is the only place the outline glyphs this design leans on exist.
export type CommunityIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

// Authored glyph names (Category icons) reach the app unchecked, so a typo renders this instead.
export const FALLBACK_ICON_NAME: IconName = "label";

export function iconNameOrFallback(name: string): IconName {
  return Object.hasOwn(GLYPHS, name) ? (name as IconName) : FALLBACK_ICON_NAME;
}
