import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { useTabScrollY } from "@/components/tab-scroll";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const TUCK_UNDER_HEADER = SPACE.lg;
const FULL_HEIGHT = 170;

// Only this part shows below the main header; the rest tucks under its bottom edge.
export const MAIN_SUB_HEADER_VISIBLE_HEIGHT = FULL_HEIGHT - TUCK_UNDER_HEADER;

interface MainSubHeaderProps {
  title: string;
}

export const MainSubHeader = ({ title }: MainSubHeaderProps) => {
  const scrollY = useTabScrollY();
  const height = Math.min(FULL_HEIGHT, Math.max(0, FULL_HEIGHT - scrollY));

  return (
    <FastSquircleView style={[styles.container, { height }]}>
      <View style={styles.divider} />
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: -TUCK_UNDER_HEADER,
    paddingTop: TUCK_UNDER_HEADER,
    marginHorizontal: SPACE.sm,
    backgroundColor: COLORS.card,
    borderBottomStartRadius: RADIUS.base,
    borderBottomEndRadius: RADIUS.base,
    overflow: "hidden",
    zIndex: -1,
  },
  divider: { height: 1, backgroundColor: COLORS.background, marginBottom: SPACE.lg },
  title: {
    ...TEXT.mainSubHeaderTitle,
    color: COLORS.ink,
    marginTop: "auto",
    marginBottom: SPACE.xs,
    paddingHorizontal: SPACE.md,
  },
});
