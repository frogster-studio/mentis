import { useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { useThemes } from "@/features/quiz/api";
import { SelectionWash, WASH_ALPHA } from "@/features/quiz/components/selection-wash";
import { ThemeCard } from "@/features/quiz/components/theme-card";
import { PICKER_ERROR } from "@/features/quiz/constants";
import { drawThemes } from "@/features/quiz/draw";
import { usePicker } from "@/features/quiz/picker-context";
import { prefetchThemeImages } from "@/features/quiz/theme-image-cache";
import { useColorCrossFade } from "@/features/quiz/use-color-cross-fade";
import { GUTTER, SPACE } from "@/theme/tokens";

export const PickerScreen = () => {
  const { data, isPending, isError, isFetching, refetch } = useThemes();
  // One Draw per visit: recomputed on every mount, stable while the screen stays up.
  const draw = useMemo(() => (data ? drawThemes(data, Math.random) : []), [data]);
  const { selected, select } = usePicker();
  const wash = useColorCrossFade(selected ? `${selected.category.color}${WASH_ALPHA}` : null);

  // The Draw warms the image cache as it renders, so the Reveal of whichever Theme wins is instant.
  useEffect(() => {
    const imageUrls = draw.map((theme) => theme.imageUrl);
    prefetchThemeImages(imageUrls);
  }, [draw]);

  // A retry leaves the query in "error" until it lands, so the spinner stands in for it.
  const feedback =
    isPending || (isError && isFetching) ? (
      <ScreenLoading />
    ) : isError ? (
      <ScreenError message={PICKER_ERROR} onRetry={() => void refetch()} />
    ) : null;

  return (
    <ScreenContainer edges={TAB_SCREEN_EDGES} underlay={<SelectionWash wash={wash} />}>
      {feedback ? (
        <View style={styles.feedback}>{feedback}</View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {draw.map((theme) => (
            <ThemeCard
              key={theme.id}
              name={theme.name}
              color={theme.category.color}
              category={theme.category}
              noSelection={!selected}
              isSelected={theme.id === selected?.id}
              onPress={() => select(theme)}
            />
          ))}
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  feedback: {
    flex: 1,
  },
  list: {
    paddingTop: SPACE.md,
    paddingHorizontal: GUTTER,
    gap: SPACE.sm,
    paddingBottom: 200,
  },
});
