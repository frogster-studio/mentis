import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import type { IconName } from "@/components/ui/icon-name";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const PILL_WIDTH = 113;
const PILL_HEIGHT = 29;
const BADGE_SIZE = 25;
const BADGE_INSET = 2;
const ICON_SIZE = 16;
const BAR_WIDTH = 67;
const BAR_HEIGHT = 8;
const BAR_RADIUS = 2;
const BAR_GAP = 6;
// The badge and the bar are the pill's own colour shaded by this much ink, never a second colour.
const SHADE_ALPHA = "1A";

export interface CategoryPillProps {
  icon: IconName;
  color: string;
  iconBg: string;
  label: string | null;
}

export const CategoryPill = ({ icon, iconBg, color, label }: CategoryPillProps) => {
  return (
    <FastSquircleView
      style={[
        styles.pill,
        label === null ? styles.placeholder : styles.labelled,
        { backgroundColor: color },
      ]}
    >
      <FastSquircleView style={[styles.badge, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon} size={ICON_SIZE} color={COLORS.ink} />
      </FastSquircleView>

      {label === null ? (
        <View style={styles.bar} />
      ) : (
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      )}
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  pill: {
    height: PILL_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: BADGE_INSET,
    borderRadius: RADIUS.sm,
  },
  placeholder: {
    width: PILL_WIDTH,
  },
  labelled: {
    alignSelf: "flex-start",
    paddingRight: SPACE.sm,
  },
  badge: {
    borderRadius: RADIUS.sm - 2,
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
    backgroundColor: `${COLORS.ink}${SHADE_ALPHA}`,
  },
  label: {
    ...TEXT.cardTitleSmall,
    color: COLORS.ink,
    textTransform: "uppercase",
    marginLeft: BAR_GAP,
  },
});
