import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { HEADER_DIVIDER_HEIGHT, HeaderCard, useHeaderCardHeight } from "@/components/header-card";
import { ProfileAvatar } from "@/components/profile-avatar";
import { profileInitial } from "@/components/profile-initial";
import {
  useMeasureTabHeader,
  useTabHeaderHeight,
  useTabScrollOffset,
} from "@/components/tab-scroll";
import { TAB_TRANSITION_EASING, TAB_TRANSITION_MS } from "@/components/tab-transition";
import { NewButton } from "@/components/ui/new-button";
import { PaperBackground } from "@/components/ui/paper-background";
import { Squircle } from "@/components/ui/squircle";
import { useProfile } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { PseudoSheet } from "@/features/account/components/pseudo-sheet";
import { PROFILE_TITLE } from "@/features/account/constants";
import { firstNameOf } from "@/features/account/user-metadata";
import { useStanding } from "@/features/competition/api";
import { HOME_TITLE, POINTS_UNIT } from "@/features/quiz/constants";
import { SeasonSummary } from "@/features/world/components/season-summary";
import { WORLD_TITLE } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

const GREETING = "Salut";
const GREETING_SUFFIX = "!";

const HOME_PATH = "/";
const WORLD_PATH = "/world";
const TAB_PATHS: readonly string[] = [HOME_PATH, WORLD_PATH];

// Two lines reserve the title before its first layout measurement.
const TITLE_LINES = 2;
const TITLE_SLOT_HEIGHT = 40 * TITLE_LINES;
const TITLE_HALF_HEIGHT = HEADER_DIVIDER_HEIGHT + SPACE.xxl + TITLE_SLOT_HEIGHT + SPACE.lg;

export function useAppHeaderHeight(path: string) {
  return useHeaderCardHeight(useTabHeaderHeight(path) ?? TITLE_HALF_HEIGHT);
}

export const AppHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.session?.user);
  const playerId = user?.id;
  const scrollOffset = useTabScrollOffset();
  const measureHeader = useMeasureTabHeader();
  const collapseHeight = useTabHeaderHeight(pathname) ?? TITLE_HALF_HEIGHT;
  const profile = useProfile(playerId);
  const standing = useStanding(playerId);
  const [pseudoVisible, setPseudoVisible] = useState(false);
  const { titleMix, slotHeight, measureTitle } = useTitleSwap(pathname);

  const titles: Record<string, string> = {
    [HOME_PATH]: HOME_TITLE,
    [WORLD_PATH]: WORLD_TITLE,
  };

  return (
    <>
      <StatusBar barStyle={pathname === WORLD_PATH ? "light-content" : "dark-content"} />
      <HeaderCard
        collapseHeight={collapseHeight}
        scrollOffset={scrollOffset}
        mask={
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: titleMix }]}>
            <PaperBackground isDark={true} />
          </Animated.View>
        }
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
                <Text style={styles.greeting} numberOfLines={1}>
                  {profile.data?.pseudo ?? ""}
                </Text>
                {standing.data ? (
                  <Squircle
                    radius={RADIUS.sm}
                    corners="all"
                    color={COLORS.background}
                    borderColor={null}
                    borderWidth={null}
                    style={styles.pointsBadge}
                  >
                    <Text style={styles.points}>
                      {standing.data.seasonTotal} {POINTS_UNIT}
                    </Text>
                  </Squircle>
                ) : null}
              </Pressable>
            ) : (
              <View style={styles.greetingSlot}>
                <Text style={styles.greeting}>{greetingFor(firstNameOf(user))}</Text>
              </View>
            )}
            <NewButton
              layout="hug"
              shape="rounded"
              tone="default"
              disabled={false}
              pending={false}
              icon="menu"
              label={null}
              accessibilityLabel={PROFILE_TITLE}
              onPress={() => router.push("/profile")}
            />
          </>
        }
      >
        <View
          style={styles.titleHalf}
          onLayout={(event) =>
            measureHeader(pathname, event.nativeEvent.layout.height + HEADER_DIVIDER_HEIGHT)
          }
        >
          <Animated.View style={[styles.titleSlot, { height: slotHeight }]}>
            {TAB_PATHS.map((path, index) => (
              <Animated.Text
                key={path}
                accessibilityElementsHidden={pathname !== path}
                importantForAccessibility={pathname === path ? "auto" : "no-hide-descendants"}
                numberOfLines={TITLE_LINES}
                onLayout={(event) => measureTitle(path, event.nativeEvent.layout.height)}
                style={[styles.title, { opacity: titleOpacityAt(titleMix, index) }]}
              >
                {titles[path]}
              </Animated.Text>
            ))}
          </Animated.View>
          {pathname === WORLD_PATH ? <SeasonSummary /> : null}
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

const styles = StyleSheet.create({
  greetingSlot: {
    flex: 1,
    height: CONTROL_SQUARE_SIZE,
    justifyContent: "center",
    paddingHorizontal: SPACE.lg,
  },
  pointsBadge: { alignSelf: "flex-start", paddingHorizontal: SPACE.xs, paddingVertical: SPACE.xxs },
  points: { ...TEXT.captionStrong, color: COLORS.ink },
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
  title: {
    ...TEXT.display,
    color: COLORS.ink,
    left: SPACE.lg,
    right: SPACE.lg,
    bottom: 0,
  },
});
