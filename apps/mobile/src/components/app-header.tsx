import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { HEADER_DIVIDER_HEIGHT, HeaderCard, useHeaderCardHeight } from "@/components/header-card";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useTabScrollOffset } from "@/components/tab-scroll";
import { TAB_TRANSITION_EASING, TAB_TRANSITION_MS } from "@/components/tab-transition";
import { NewButton } from "@/components/ui/new-button";
import { useAuthStore } from "@/features/account/auth-store";
import { ACCOUNT_TITLE } from "@/features/account/constants";
import { HOME_TITLE } from "@/features/quiz/constants";
import { WORLD_TITLE } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, SPACE } from "@/theme/tokens";

const GREETING = "Salut";
const GREETING_SUFFIX = "!";

const TAB_TITLES = [
  { path: "/", title: HOME_TITLE },
  { path: "/world", title: WORLD_TITLE },
] as const;

// « Un peu d'entrainement ? » is the tallest title, so the card the screens pad for is its card.
const TITLE_LINES = 2;
const TITLE_SLOT_HEIGHT = TEXT.display.lineHeight * TITLE_LINES;
const TITLE_HALF_HEIGHT = HEADER_DIVIDER_HEIGHT + SPACE.xxl + TITLE_SLOT_HEIGHT + SPACE.lg;

export function useAppHeaderHeight() {
  return useHeaderCardHeight(TITLE_HALF_HEIGHT);
}

export function AppHeader() {
  const router = useRouter();
  const user = useAuthStore((state) => state.session?.user);
  const scrollOffset = useTabScrollOffset();
  const { titleMix, slotHeight, measureTitle } = useTitleSwap();

  return (
    <HeaderCard
      collapseHeight={TITLE_HALF_HEIGHT}
      scrollOffset={scrollOffset}
      topRow={
        <>
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
        </>
      }
    >
      <View style={styles.titleHalf}>
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
      </View>
    </HeaderCard>
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
  titleHalf: {
    paddingBottom: SPACE.lg,
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
