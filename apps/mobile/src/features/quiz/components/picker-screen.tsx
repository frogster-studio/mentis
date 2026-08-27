import { useNavigation, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { HEADER_DIVIDER_HEIGHT, HeaderCard, useHeaderCardHeight } from "@/components/header-card";
import { NewButton } from "@/components/ui/new-button";
import { ScreenContainer } from "@/components/ui/screen-container";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { Sheet } from "@/components/ui/sheet";
import { useThemes } from "@/features/quiz/api";
import { HomeEmptyState } from "@/features/quiz/components/home-empty-state";
import { SwipableButton } from "@/features/quiz/components/swipable-button";
import { ThemeCard } from "@/features/quiz/components/theme-card";
import {
  HOME_EMPTY_TITLE,
  PICKER_BACK_LABEL,
  PICKER_ERROR,
  PICKER_SUBTITLE,
  PICKER_TITLE,
  PRACTICE_TITLE,
} from "@/features/quiz/constants";
import { drawThemes } from "@/features/quiz/draw";
import { prefetchThemeImages } from "@/features/quiz/theme-image-cache";
import { type ColorCrossFade, useColorCrossFade } from "@/features/quiz/use-color-cross-fade";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, GUTTER, SPACE } from "@/theme/tokens";
import type { ThemeWithCount } from "@/types/quiz";

const WASH_ALPHA = "38";

const TITLE_HALF_HEIGHT =
  HEADER_DIVIDER_HEIGHT +
  SPACE.xxl +
  TEXT.display.lineHeight +
  SPACE.sm +
  TEXT.caption.lineHeight +
  SPACE.lg;

export const PickerScreen = () => {
  const router = useRouter();
  const { data, isPending, isError, isFetching, refetch } = useThemes();
  // One Draw per visit: recomputed on every mount, stable while the screen stays up.
  const draw = useMemo(() => (data ? drawThemes(data, Math.random) : []), [data]);
  const [selected, setSelected] = useState<ThemeWithCount | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const scrollOffset = useRef(new Animated.Value(0)).current;
  const headerHeight = useHeaderCardHeight(TITLE_HALF_HEIGHT);
  const wash = useColorCrossFade(selected ? `${selected.category.color}${WASH_ALPHA}` : null);
  const leave = useBarredBackGestures(() => router.back());

  // The Draw warms the image cache as it renders, so the Reveal of whichever Theme wins is instant.
  useEffect(() => {
    const imageUrls = draw.map((theme) => theme.imageUrl);
    prefetchThemeImages(imageUrls);
  }, [draw]);

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
        categoryIcon: selected.category.icon,
      },
    });
  };

  // A retry leaves the query in "error" until it lands, so the spinner stands in for it.
  const feedback =
    isPending || (isError && isFetching) ? (
      <ScreenLoading />
    ) : isError ? (
      <ScreenError message={PICKER_ERROR} onRetry={() => void refetch()} />
    ) : null;

  return (
    <ScreenContainer edges={["left", "right"]} underlay={<SelectionWash wash={wash} />}>
      {feedback ? (
        <View style={[styles.feedback, { paddingTop: headerHeight }]}>{feedback}</View>
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollOffset } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.list,
            { paddingTop: headerHeight + SPACE.md, paddingBottom: 200 },
          ]}
        >
          {draw.map((theme) => (
            <ThemeCard
              key={theme.id}
              name={theme.name}
              color={theme.category.color}
              category={theme.category}
              noSelection={!selected}
              isSelected={theme.id === selected?.id}
              onPress={() => setSelected(theme)}
            />
          ))}
        </Animated.ScrollView>
      )}
      <HeaderCard
        collapseHeight={TITLE_HALF_HEIGHT}
        scrollOffset={scrollOffset}
        mask={<SelectionWash wash={wash} />}
        topRow={
          <>
            <View style={styles.labelSlot}>
              <Text style={styles.label}>{PRACTICE_TITLE}</Text>
            </View>
            <View style={styles.actions}>
              <NewButton
                layout="hug"
                shape="rounded"
                tone="default"
                icon="tooltip-question-outline"
                label={null}
                accessibilityLabel={HOME_EMPTY_TITLE}
                onPress={() => setHelpVisible(true)}
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
          </>
        }
      >
        <View style={styles.titleHalf}>
          <Text style={styles.title}>{PICKER_TITLE}</Text>
          <Text style={styles.subtitle}>{PICKER_SUBTITLE}</Text>
        </View>
      </HeaderCard>

      <SwipableButton color={selected?.category.color ?? null} start={onStart} />

      <Sheet
        visible={helpVisible}
        title={null}
        message={null}
        dismissible={true}
        onDismiss={() => setHelpVisible(false)}
      >
        <HomeEmptyState />
      </Sheet>
    </ScreenContainer>
  );
};

interface SelectionWashProps {
  wash: ColorCrossFade;
}

// The wash rides between the paper's grid and the content, so the squares keep showing through.
const SelectionWash = ({ wash }: SelectionWashProps) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {wash.base ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: wash.base, opacity: wash.baseOpacity },
          ]}
        />
      ) : null}
      {wash.top ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: wash.top, opacity: wash.topOpacity }]}
        />
      ) : null}
    </View>
  );
};

// The pill's drag starts at the screen edge, so both OS back gestures are barred on this screen.
function useBarredBackGestures(goBack: () => void) {
  const navigation = useNavigation();
  const leavingRef = useRef(false);

  // iOS: the edge swipe never starts. Android's system gesture lands as GO_BACK below.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        // A pop from a screen above (the session quitting home) must keep its way through.
        if (navigation.isFocused() && !leavingRef.current) {
          event.preventDefault();
        }
      }),
    [navigation],
  );

  return () => {
    leavingRef.current = true;
    goBack();
  };
}

const styles = StyleSheet.create({
  feedback: {
    flex: 1,
  },
  list: {
    paddingHorizontal: GUTTER,
    gap: SPACE.sm,
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
  titleHalf: {
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.xxl,
    paddingBottom: SPACE.lg,
  },
  title: {
    ...TEXT.display,
    color: COLORS.ink,
  },
  subtitle: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
    marginTop: SPACE.sm,
  },
});
