import { usePathname } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePicker } from "@/components/quiz/picker-provider";
import { NewButton } from "@/components/ui/new-button";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { PremiumCrownStamp } from "@/features/premium/components/premium-crown-stamp";
import {
  CUSTOM_PICKER_TITLE,
  PICKER_BACK_LABEL,
  PICKER_HELP_LABEL,
  PICKER_SUBTITLE,
  PICKER_TITLE,
  PRACTICE_TITLE,
} from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

const CUSTOM_PATH = "/picker/custom";

const noop = () => {};

export const PickerHeader = () => {
  const insets = useSafeAreaInsets();
  const isCustom = usePathname() === CUSTOM_PATH;
  const { leave } = usePicker();

  return (
    <View style={[styles.header, { paddingTop: insets.top + SPACE.xs }]}>
      <FastSquircleView style={styles.card}>
        <View style={styles.row}>
          <View style={styles.labelSlot}>
            <Text style={styles.label}>{PRACTICE_TITLE}</Text>
          </View>
          <View style={styles.actions}>
            <NewButton
              layout="hug"
              shape="rounded"
              tone="default"
              icon="help-circle-outline"
              label={null}
              accessibilityLabel={PICKER_HELP_LABEL}
              onPress={noop}
              disabled={false}
              pending={false}
            />
            <NewButton
              layout="hug"
              shape="rounded"
              tone="default"
              icon="close"
              label={null}
              accessibilityLabel={PICKER_BACK_LABEL}
              onPress={leave}
              disabled={false}
              pending={false}
            />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.titleHalf}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            {isCustom ? CUSTOM_PICKER_TITLE : PICKER_TITLE}
          </Text>
          {/* The slot stays whether it reads or not, so the header never jumps between tabs. */}
          <View style={styles.subtitleSlot}>
            {isCustom ? null : (
              <Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit>
                {PICKER_SUBTITLE}
              </Text>
            )}
          </View>
          {isCustom ? (
            <View style={styles.stamp}>
              <PremiumCrownStamp />
            </View>
          ) : null}
        </View>
      </FastSquircleView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    paddingHorizontal: GUTTER,
  },
  card: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.md,
    paddingHorizontal: SPACE.lg,
  },
  labelSlot: {
    flex: 1,
    height: CONTROL_SQUARE_SIZE,
    justifyContent: "center",
  },
  label: {
    ...TEXT.body,
    color: COLORS.ink,
  },
  actions: {
    flexDirection: "row",
    gap: SPACE.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
  titleHalf: {
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.xxl,
    paddingBottom: SPACE.lg,
  },
  title: {
    ...TEXT.display,
    color: COLORS.ink,
  },
  subtitleSlot: {
    height: TEXT.captionStrong.lineHeight,
    marginTop: SPACE.sm,
  },
  subtitle: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
  },
  stamp: {
    position: "absolute",
    top: SPACE.xs,
    right: SPACE.lg,
  },
});
