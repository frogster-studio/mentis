import { StyleSheet, Text, View } from "react-native";
import { useAppHeaderHeight } from "@/components/app-header";
import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { WORLD_PLACEHOLDER } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER } from "@/theme/tokens";

export function WorldScreen() {
  const headerHeight = useAppHeaderHeight();

  return (
    <ScreenContainer edges={TAB_SCREEN_EDGES}>
      <View style={[styles.content, { paddingTop: headerHeight }]}>
        <Text style={styles.copy}>{WORLD_PLACEHOLDER}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: GUTTER,
  },
  copy: {
    ...TEXT.body,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
});
