import { usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MAIN_SUB_HEADER_VISIBLE_HEIGHT, MainSubHeader } from "@/components/main-sub-header";
import { ProfileAvatar } from "@/components/profile-avatar";
import { profileInitial } from "@/components/profile-initial";
import { NewButton } from "@/components/ui/new-button";
import { Squircle } from "@/components/ui/squircle";
import { useProfile } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { PseudoSheet } from "@/features/account/components/pseudo-sheet";
import { PROFILE_TITLE } from "@/features/account/constants";
import { firstNameOf } from "@/features/account/user-metadata";
import { useStanding } from "@/features/competition/api";
import { HOME_TITLE, POINTS_UNIT } from "@/features/quiz/constants";
import { WORLD_TITLE } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, PRESSED, RADIUS, SPACE } from "@/theme/tokens";
import { gradient } from "@/utils/gradient";

const GREETING = "Salut";
const GREETING_SUFFIX = "!";

const MAIN_HEADER_HEIGHT = 90;
const MAIN_HEADER_TOP_GAP = SPACE.sm;

export const WORLD_PATH = "/world";

// The header floats over the tabs, so a tab screen pads its content by this.
export function useMainHeaderHeight() {
  return (
    useSafeAreaInsets().top +
    MAIN_HEADER_TOP_GAP +
    MAIN_HEADER_HEIGHT +
    MAIN_SUB_HEADER_VISIBLE_HEIGHT
  );
}

interface MainHeaderProps {
  isDark: boolean;
}

export const MainHeader = ({ isDark }: MainHeaderProps) => {
  const router = useRouter();
  const isWorld = usePathname() === WORLD_PATH;
  const user = useAuthStore((state) => state.session?.user);
  const playerId = user?.id;
  const profile = useProfile(playerId);
  const standing = useStanding(playerId);
  const [pseudoVisible, setPseudoVisible] = useState(false);

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView edges={["top"]} style={styles.header}>
        <PaperFade isDark={isDark} />

        <FastSquircleView style={styles.row}>
          <ProfileAvatar initial={profileInitial(profile.data?.pseudo)} />

          {isWorld ? (
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
        </FastSquircleView>

        <MainSubHeader title={isWorld ? WORLD_TITLE : HOME_TITLE} />
      </SafeAreaView>

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

interface PaperFadeProps {
  isDark: boolean;
}

// Matches the paper under the tabs, so content scrolling up fades into the page itself.
const PaperFade = ({ isDark }: PaperFadeProps) => {
  const { top } = useSafeAreaInsets();
  const paperColor = isDark ? COLORS.ink : COLORS.background;

  return (
    <>
      <View style={[styles.fadeSolid, { height: top + SPACE.lg, backgroundColor: paperColor }]} />
      <View
        style={[
          styles.fadeGradient,
          {
            top: top + SPACE.lg,
            height: MAIN_HEADER_HEIGHT - SPACE.lg,
            ...gradient(`linear-gradient(to bottom, ${paperColor}, ${paperColor}00)`),
          },
        ]}
      />
    </>
  );
};

function greetingFor(firstName: string | undefined): string {
  return [GREETING, firstName, GREETING_SUFFIX].filter(Boolean).join(" ");
}

const styles = StyleSheet.create({
  header: { position: "absolute", top: 0, left: 0, right: 0 },
  fadeSolid: { position: "absolute", top: 0, left: 0, right: 0 },
  fadeGradient: { position: "absolute", left: 0, right: 0 },
  row: {
    height: MAIN_HEADER_HEIGHT,
    marginHorizontal: SPACE.sm,
    marginTop: MAIN_HEADER_TOP_GAP,
    padding: SPACE.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.base,
    flexDirection: "row",
    alignItems: "center",
  },
  greetingSlot: {
    flex: 1,
    height: CONTROL_SQUARE_SIZE,
    justifyContent: "center",
    paddingHorizontal: SPACE.lg,
  },
  greeting: { ...TEXT.body, color: COLORS.ink },
  pointsBadge: { alignSelf: "flex-start", paddingHorizontal: SPACE.xs, paddingVertical: SPACE.xxs },
  points: { ...TEXT.captionStrong, color: COLORS.ink },
  pressed: PRESSED,
});
