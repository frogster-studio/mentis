import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useTabScrollOffset } from "@/components/tab-scroll";
import { TAB_TRANSITION_EASING, TAB_TRANSITION_MS } from "@/components/tab-transition";
import { NewButton } from "@/components/ui/new-button";
import { PaperBackground } from "@/components/ui/paper-background";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { Squircle } from "@/components/ui/squircle";
import { PRESS_DEPTH } from "@/components/ui/use-press-sink";
import { useAuthStore } from "@/features/account/auth-store";
import { ACCOUNT_TITLE } from "@/features/account/constants";
import { HOME_TITLE } from "@/features/quiz/constants";
import { WORLD_TITLE } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

const GREETING = "Salut";
const GREETING_SUFFIX = "!";

const TAB_TITLES = [
  { path: "/", title: HOME_TITLE },
  { path: "/world", title: WORLD_TITLE },
] as const;

const CARD_TOP_GAP = SPACE.xs;
const ROW_HEIGHT = CONTROL_SQUARE_SIZE + PRESS_DEPTH;
const DIVIDER_HEIGHT = 1;
const GREETING_HALF_HEIGHT = SPACE.lg + ROW_HEIGHT + SPACE.md;
// « Un peu d'entrainement ? » is the tallest title, so the card the screens pad for is its card.
const TITLE_LINES = 2;
const TITLE_SLOT_HEIGHT = TEXT.display.lineHeight * TITLE_LINES;
const TITLE_HALF_HEIGHT = DIVIDER_HEIGHT + SPACE.xxl + TITLE_SLOT_HEIGHT + SPACE.lg;
const CARD_HEIGHT = CARD_TOP_GAP + GREETING_HALF_HEIGHT + TITLE_HALF_HEIGHT;

// The card reaches under the status bar, so content clears the inset as well as the card.
export function useAppHeaderHeight() {
  return useSafeAreaInsets().top + CARD_HEIGHT;
}

export function AppHeader() {
  const router = useRouter();
  const user = useAuthStore((state) => state.session?.user);
  const insets = useSafeAreaInsets();
  const scrollOffset = useTabScrollOffset();
  const { titleMix, slotHeight, measureTitle } = useTitleSwap();

  const collapse = scrollOffset.interpolate({
    inputRange: [0, TITLE_HALF_HEIGHT],
    outputRange: [0, -TITLE_HALF_HEIGHT],
    extrapolate: "clamp",
  });
  const bridgeOpacity = scrollOffset.interpolate({
    inputRange: [TITLE_HALF_HEIGHT - RADIUS.xl, TITLE_HALF_HEIGHT],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.overlay}>
      {/* Content scrolls up into the status bar, so the paper carries on over it. */}
      <View style={[styles.mask, { height: insets.top + CARD_TOP_GAP }]} pointerEvents="none">
        <PaperBackground />
      </View>
      <View style={styles.band}>
        <View style={styles.stack}>
          <View style={styles.greetingHalf}>
            <Squircle radius={RADIUS.xl} color={COLORS.card} style={styles.greetingFace} />
            <View style={styles.row}>
              <ProfileAvatar photoUrl={metadataString(user, "avatar_url")} />
              <View style={styles.greetingSlot}>
                <Text style={styles.greeting}>{greetingFor(firstNameOf(user))}</Text>
              </View>
              <NewButton
                layout="hug"
                shape="rounded"
                icon="menu"
                accessibilityLabel={ACCOUNT_TITLE}
                onPress={() => router.push("/account")}
              />
            </View>
          </View>
          {/* Fills the card's bottom corners until the title has gone, so the join reads as one card. */}
          <Animated.View style={[styles.bridge, { opacity: bridgeOpacity }]} pointerEvents="none" />
          <View style={styles.titleWindow}>
            <Animated.View style={{ transform: [{ translateY: collapse }] }}>
              <Squircle
                radius={RADIUS.base}
                corners="bottom"
                color={COLORS.card}
                style={styles.titleCard}
              >
                <View style={styles.divider} />
                <Animated.View style={[styles.titleSlot, { height: slotHeight }]}>
                  {TAB_TITLES.map(({ path, title }, index) => (
                    <Animated.Text
                      key={path}
                      numberOfLines={TITLE_LINES}
                      onLayout={(event) => measureTitle(path, event.nativeEvent.layout.height)}
                      style={[styles.title, { opacity: titleOpacityAt(titleMix, index) }]}
                    >
                      {title}
                    </Animated.Text>
                  ))}
                </Animated.View>
              </Squircle>
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

// The card never rides the tab slide, so its title is the only thing that crosses tabs.
function useTitleSwap() {
  const pathname = usePathname();
  const titleMix = useRef(new Animated.Value(0)).current;
  const slotHeight = useRef(new Animated.Value(TITLE_SLOT_HEIGHT)).current;
  const [heights, setHeights] = useState<Record<string, number>>({});
  const measured = useRef(false);
  const index = TAB_TITLES.findIndex((tab) => tab.path === pathname);
  const activeHeight = index === -1 ? undefined : heights[TAB_TITLES[index].path];

  const measureTitle = useCallback((path: string, height: number) => {
    setHeights((current) => (current[path] === height ? current : { ...current, [path]: height }));
  }, []);

  useEffect(() => {
    if (index === -1) {
      return;
    }
    // The slot hugs its title, so a one-line tab does not wear the wrapping tab's empty band.
    const height = activeHeight ?? TITLE_SLOT_HEIGHT;
    if (!measured.current) {
      measured.current = activeHeight !== undefined;
      slotHeight.setValue(height);
      titleMix.setValue(index);
      return;
    }
    Animated.parallel([
      Animated.timing(titleMix, {
        toValue: index,
        duration: TAB_TRANSITION_MS,
        easing: TAB_TRANSITION_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(slotHeight, {
        toValue: height,
        duration: TAB_TRANSITION_MS,
        easing: TAB_TRANSITION_EASING,
        useNativeDriver: false,
      }),
    ]).start();
  }, [index, activeHeight, titleMix, slotHeight]);

  return { titleMix, slotHeight, measureTitle };
}

function titleOpacityAt(mix: Animated.Value, index: number) {
  return mix.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [0, 1, 0],
    extrapolate: "clamp",
  });
}

function greetingFor(firstName: string | undefined): string {
  return [GREETING, firstName, GREETING_SUFFIX].filter(Boolean).join(" ");
}

function firstNameOf(user: User | undefined): string | undefined {
  return metadataString(user, "full_name")?.split(" ")[0];
}

// Supabase types user metadata as an open bag, so every read out of it is checked.
function metadataString(user: User | undefined, key: string): string | undefined {
  const value: unknown = user?.user_metadata[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  mask: {
    width: "100%",
    backgroundColor: COLORS.background,
  },
  band: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: GUTTER,
    pointerEvents: "box-none",
  },
  stack: {
    pointerEvents: "box-none",
  },
  greetingFace: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  greetingHalf: {
    height: GREETING_HALF_HEIGHT,
    paddingTop: SPACE.lg,
    zIndex: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: SPACE.lg,
  },
  greetingSlot: {
    flex: 1,
    height: CONTROL_SQUARE_SIZE,
    justifyContent: "center",
    paddingHorizontal: SPACE.lg,
  },
  greeting: {
    ...TEXT.body,
    color: COLORS.ink,
  },
  bridge: {
    position: "absolute",
    left: 0,
    right: 0,
    top: GREETING_HALF_HEIGHT - RADIUS.xl,
    height: RADIUS.xl,
    backgroundColor: COLORS.card,
    zIndex: 1,
  },
  titleWindow: {
    height: TITLE_HALF_HEIGHT,
    overflow: "hidden",
  },
  titleCard: {
    paddingBottom: SPACE.lg,
  },
  divider: {
    height: DIVIDER_HEIGHT,
    backgroundColor: COLORS.divider,
  },
  titleSlot: {
    marginTop: SPACE.xxl,
  },
  // The titles are stacked on one baseline so the cross-fade swaps them in place.
  title: {
    ...TEXT.display,
    color: COLORS.ink,
    position: "absolute",
    left: SPACE.lg,
    right: SPACE.lg,
    bottom: 0,
  },
});
