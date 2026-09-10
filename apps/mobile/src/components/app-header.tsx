import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { HEADER_DIVIDER_HEIGHT, HeaderCard, useHeaderCardHeight } from "@/components/header-card";
import { ProfileAvatar } from "@/components/profile-avatar";
import { profileInitial } from "@/components/profile-initial";
import { useTabScrollOffset } from "@/components/tab-scroll";
import { TAB_TRANSITION_EASING, TAB_TRANSITION_MS } from "@/components/tab-transition";
import { NewButton } from "@/components/ui/new-button";
import { useProfile } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { PseudoSheet } from "@/features/account/components/pseudo-sheet";
import { ACCOUNT_TITLE } from "@/features/account/constants";
import { useStanding } from "@/features/competition/api";
import { standingTitle } from "@/features/competition/standing-title";
import { HOME_TITLE } from "@/features/quiz/constants";
import { WORLD_TITLE } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, PRESSED, SPACE } from "@/theme/tokens";

const GREETING = "Salut";
const GREETING_SUFFIX = "!";

const HOME_PATH = "/";
const WORLD_PATH = "/world";
const TAB_PATHS: readonly string[] = [HOME_PATH, WORLD_PATH];

// « Un peu d'entrainement ? » is the tallest title, so the card the screens pad for is its card.
const TITLE_LINES = 2;
const TITLE_SLOT_HEIGHT = TEXT.display.lineHeight * TITLE_LINES;
const TITLE_HALF_HEIGHT = HEADER_DIVIDER_HEIGHT + SPACE.xxl + TITLE_SLOT_HEIGHT + SPACE.lg;

export function useAppHeaderHeight() {
  return useHeaderCardHeight(TITLE_HALF_HEIGHT);
}

// What the card still covers once its title half has slid away — where sticky content comes to rest.
export function useCollapsedAppHeaderHeight() {
  return useHeaderCardHeight(0);
}

export const AppHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.session?.user);
  const playerId = user?.id;
  const scrollOffset = useTabScrollOffset();
  const profile = useProfile(playerId);
  const standing = useStanding(playerId);
  const [pseudoVisible, setPseudoVisible] = useState(false);
  const { titleMix, slotHeight, measureTitle } = useTitleSwap(pathname);

  const titles: Record<string, string> = {
    [HOME_PATH]: HOME_TITLE,
    [WORLD_PATH]: standingTitle(standing.data) ?? WORLD_TITLE,
  };

  return (
    <>
      <HeaderCard
        collapseHeight={TITLE_HALF_HEIGHT}
        scrollOffset={scrollOffset}
        mask={null}
        topRow={
          <>
            <ProfileAvatar initial={profileInitial(profile.data?.pseudo)} />

            {pathname === WORLD_PATH ? (
              <Pressable
                style={({ pressed }) => [styles.greetingSlot, pressed && styles.pressed]}
                disabled={playerId === undefined}
                onPress={() => setPseudoVisible(true)}
              >
                {/* The Competition names the Player by pseudo, so the greeting has no place here. */}
                <Text style={styles.greeting}>{profile.data?.pseudo ?? ""}</Text>
              </Pressable>
            ) : (
              <View style={styles.greetingSlot}>
                <Text style={styles.greeting}>{greetingFor(firstNameOf(user))}</Text>
              </View>
            )}
            <NewButton
              layout="hug"
              shape="full"
              tone="default"
              disabled={false}
              pending={false}
              icon="menu"
              label={null}
              accessibilityLabel={ACCOUNT_TITLE}
              onPress={() => router.push("/account")}
            />
          </>
        }
      >
        <View style={styles.titleHalf}>
          <Animated.View style={[styles.titleSlot, { height: slotHeight }]}>
            {TAB_PATHS.map((path, index) => (
              <Animated.Text
                key={path}
                numberOfLines={TITLE_LINES}
                onLayout={(event) => measureTitle(path, event.nativeEvent.layout.height)}
                style={[styles.title, { opacity: titleOpacityAt(titleMix, index) }]}
              >
                {titles[path]}
              </Animated.Text>
            ))}
          </Animated.View>
        </View>
      </HeaderCard>

      {playerId === undefined ? null : (
        <PseudoSheet
          playerId={playerId}
          visible={pseudoVisible}
          onDismiss={() => setPseudoVisible(false)}
        />
      )}
    </>
  );
};

// The card never rides the tab slide, so its title is the only thing that crosses tabs.
function useTitleSwap(pathname: string) {
  const titleMix = useRef(new Animated.Value(0)).current;
  const slotHeight = useRef(new Animated.Value(TITLE_SLOT_HEIGHT)).current;
  const [heights, setHeights] = useState<Record<string, number>>({});
  const measured = useRef(false);
  const index = TAB_PATHS.indexOf(pathname);
  const activeHeight = index === -1 ? undefined : heights[TAB_PATHS[index]];

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
  pressed: PRESSED,
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
