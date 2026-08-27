import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import type { CommunityIconName } from "@/components/ui/icon-name";
import { Squircle } from "@/components/ui/squircle";
import { COLORS, RADIUS } from "@/theme/tokens";

const PILL_WIDTH = 113;
const PILL_HEIGHT = 29;
const BADGE_SIZE = 25;
const BADGE_INSET = 2;
const ICON_SIZE = 16;
const BAR_WIDTH = 67;
const BAR_HEIGHT = 8;
const BAR_RADIUS = 2;
const BAR_GAP = 6;

// The label is a bar until Categories are drawn for real; only the glyph carries meaning today.
export function CategoryPill({ icon }: { icon: CommunityIconName }) {
  return (
    <Squircle radius={RADIUS.sm} color={COLORS.primarySunken} style={styles.pill}>
      <Squircle radius={BADGE_SIZE / 3} color={COLORS.primary} style={styles.badge}>
        <MaterialCommunityIcons name={icon} size={ICON_SIZE} color={COLORS.inkMuted} />
      </Squircle>
      <View style={styles.bar} />
    </Squircle>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: BADGE_INSET,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    marginLeft: BAR_GAP,
    borderRadius: BAR_RADIUS,
    backgroundColor: COLORS.primaryPlaceholder,
  },
});
