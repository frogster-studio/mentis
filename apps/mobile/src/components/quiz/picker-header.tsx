import { usePathname } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { MainHeader } from "@/components/main-header";
import { MainSubHeader } from "@/components/main-sub-header";
import { usePicker } from "@/components/quiz/picker-provider";
import { NewButton } from "@/components/ui/new-button";
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
import { COLORS, CONTROL_SQUARE_SIZE, SPACE } from "@/theme/tokens";

const CUSTOM_PATH = "/picker/custom";

const noop = () => {};

export const PickerHeader = () => {
  const isCustom = usePathname() === CUSTOM_PATH;
  const { leave } = usePicker();

  return (
    <MainHeader
      isDark={false}
      subHeader={
        <MainSubHeader>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            {isCustom ? CUSTOM_PICKER_TITLE : PICKER_TITLE}
          </Text>
          {/* The slot stays whether it reads or not, so the title sits at one height on both tabs. */}
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
        </MainSubHeader>
      }
    >
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
    </MainHeader>
  );
};

const styles = StyleSheet.create({
  labelSlot: { flex: 1, height: CONTROL_SQUARE_SIZE, justifyContent: "center" },
  label: { ...TEXT.body, color: COLORS.ink },
  actions: { flexDirection: "row", gap: SPACE.sm },
  title: { ...TEXT.mainSubHeaderTitle, color: COLORS.ink },
  subtitleSlot: { height: TEXT.captionStrong.lineHeight, marginTop: SPACE.xs },
  subtitle: { ...TEXT.caption, color: COLORS.inkMuted },
  stamp: { position: "absolute", top: 0, right: 0 },
});
