import { useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurBand } from "@/components/ui/blur-band";
import { QuietButton } from "@/components/ui/quiet-button";
import { ScreenContainer } from "@/components/ui/screen-container";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { useThemes } from "@/features/quiz/api";
import { ThemeCard } from "@/features/quiz/components/theme-card";
import { PICKER_BACK_LABEL, PICKER_ERROR, PICKER_TITLE } from "@/features/quiz/constants";
import { drawThemes } from "@/features/quiz/draw";
import { prefetchThemeImages } from "@/features/quiz/theme-image-cache";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, GUTTER, SPACE } from "@/theme/tokens";

export function PickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, isFetching, refetch } = useThemes();
  // One Draw per visit: recomputed on every mount, stable while the screen stays up.
  const draw = useMemo(() => (data ? drawThemes(data, Math.random) : []), [data]);
  const headerHeight = insets.top + (CONTROL_HEIGHT + SPACE.md * 2);

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
    <ScreenContainer edges={["left", "right", "bottom"]}>
      {feedback ? (
        <View style={[styles.feedback, { paddingTop: headerHeight }]}>{feedback}</View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingTop: headerHeight }]}
        >
          {draw.map((theme) => (
            <ThemeCard
              key={theme.id}
              name={theme.name}
              category={theme.category}
              onPress={() =>
                router.push({
                  pathname: "/session/[themeId]",
                  params: {
                    themeId: theme.id,
                    name: theme.name,
                    imageUrl: theme.imageUrl,
                    categoryId: theme.category.id,
                    categoryName: theme.category.name,
                    categoryColor: theme.category.color,
                    categoryIcon: theme.category.icon,
                  },
                })
              }
            />
          ))}
        </ScrollView>
      )}
      {/* After the list in JSX: expo-blur only blurs what mounted before it. */}
      <BlurBand edge="top">
        <View style={[styles.header, { height: headerHeight, paddingTop: insets.top + SPACE.md }]}>
          <QuietButton
            layout="circle"
            icon="chevron-left"
            accessibilityLabel={PICKER_BACK_LABEL}
            onPress={() => router.back()}
          />
          <Text style={styles.title}>{PICKER_TITLE}</Text>
          {/* Balances the back circle, so the title holds the screen's centre line. */}
          <View style={styles.spacer} />
        </View>
      </BlurBand>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  feedback: {
    flex: 1,
  },
  list: {
    paddingHorizontal: GUTTER,
    paddingBottom: GUTTER,
    gap: SPACE.md,
  },
  // Taps stop at the band, so a card scrolled half under it is never hit by mistake.
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: GUTTER,
    paddingVertical: SPACE.md,
  },
  title: {
    ...TEXT.screenTitle,
    flex: 1,
    color: COLORS.ink,
    textAlign: "center",
  },
  spacer: {
    width: CONTROL_HEIGHT,
  },
});
