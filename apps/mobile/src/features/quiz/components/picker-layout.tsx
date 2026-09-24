import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppTabBar, TAB_ICON_SIZE } from "@/components/app-tab-bar";
import { useTabSlide } from "@/components/tab-slide";
import { PaperBackground } from "@/components/ui/paper-background";
import { PickerHeader } from "@/features/quiz/components/picker-header";
import { SelectionWash, WASH_ALPHA } from "@/features/quiz/components/selection-wash";
import { SwipableButton } from "@/features/quiz/components/swipable-button";
import { PICKER_CLASSIC_TAB_LABEL, PICKER_CUSTOM_TAB_LABEL } from "@/features/quiz/constants";
import { PickerProvider } from "@/features/quiz/picker-context";
import { useBarredBackGestures } from "@/features/quiz/use-barred-back-gestures";
import { useColorCrossFade } from "@/features/quiz/use-color-cross-fade";
import { COLORS } from "@/theme/tokens";
import type { ThemeWithCount } from "@/types/quiz";

export const PickerLayout = () => {
  const router = useRouter();
  const slide = useTabSlide();
  const [selected, setSelected] = useState<ThemeWithCount | null>(null);
  const leave = useBarredBackGestures(() => router.back());
  const wash = useColorCrossFade(selected ? `${selected.category.color}${WASH_ALPHA}` : null);
  const trackColor = selected?.category.color ?? COLORS.quiet;

  const onStart = () => {
    if (!selected) {
      return;
    }
    router.push({
      pathname: "/session/[themeId]",
      params: {
        themeId: selected.id,
        name: selected.name,
        imageUrl: selected.imageUrl,
        categoryId: selected.category.id,
        categoryName: selected.category.name,
        categoryColor: selected.category.color,
        categorySecondaryColor: selected.category.secondaryColor,
        categoryIcon: selected.category.icon,
      },
    });
  };

  return (
    <PickerProvider value={{ selected, select: setSelected, leave }}>
      <View style={styles.shell}>
        <PaperBackground isDark={false} />
        <SelectionWash wash={wash} />
        {/* Above the scenes, not over them, so the card holds still while the tabs slide under it. */}
        <PickerHeader />
        <Tabs
          tabBar={(props) => <AppTabBar {...props} isDark={false} trackColor={trackColor} />}
          screenOptions={{ headerShown: false, ...slide }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: PICKER_CLASSIC_TAB_LABEL,
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons
                  name="animation-play-outline"
                  color={color}
                  size={TAB_ICON_SIZE}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="custom"
            options={{
              title: PICKER_CUSTOM_TAB_LABEL,
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons name="tune-variant" color={color} size={TAB_ICON_SIZE} />
              ),
            }}
          />
        </Tabs>
        <SwipableButton color={selected?.category.color ?? null} start={onStart} />
      </View>
    </PickerProvider>
  );
};

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: COLORS.background },
});
