import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { MainHeader } from "@/components/main-header";
import { profileInitial } from "@/components/profile-initial";
import { NewButton } from "@/components/ui/new-button";
import { Squircle } from "@/components/ui/squircle";
import { PRESS_DEPTH } from "@/components/ui/use-press-sink";
import { useProfile } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { ProfilePortrait } from "@/features/account/components/profile-portrait";
import { PseudoSheet } from "@/features/account/components/pseudo-sheet";
import {
  PROFILE_CLOSE_LABEL,
  PROFILE_TITLE,
  SIGN_IN_CHIP_LABEL,
} from "@/features/account/constants";
import { useSignInStore } from "@/features/account/sign-in-store";
import { avatarUrlOf, fullNameOf } from "@/features/account/user-metadata";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, PRESSED, RADIUS, SPACE } from "@/theme/tokens";
// The pseudo is the Competition name, so the Competition medal sits beside it.
import { MEDAL_IMAGE } from "@/utils/assets";

const CHIP_TINT = "14";

export const ProfileHeader = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.session?.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const playerId = user?.id;
  const profile = useProfile(playerId);
  const openSignIn = useSignInStore((state) => state.open);
  const [pseudoVisible, setPseudoVisible] = useState(false);

  // The restoring session is neither state yet, so the card waits rather than flash the signed-out name.
  const isSignedOut = !isLoading && user === undefined;
  const name = isSignedOut ? PROFILE_TITLE : (fullNameOf(user) ?? profile.data?.pseudo ?? "");

  return (
    <>
      <MainHeader isDark={false} paperColor={COLORS.catchupMist} subHeader={null}>
        <View style={styles.portraitSlot}>
          <Squircle
            radius={RADIUS.base}
            corners="all"
            color={COLORS.ink}
            borderColor={null}
            borderWidth={null}
            style={styles.portraitEdge}
          />
          <FastSquircleView style={styles.portrait}>
            <ProfilePortrait
              photoUrl={avatarUrlOf(user) ?? null}
              initial={profileInitial(profile.data?.pseudo)}
              isSignedOut={isSignedOut}
            />
          </FastSquircleView>
        </View>

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>

          <View style={styles.chipRow}>
            {isSignedOut ? (
              <Chip label={SIGN_IN_CHIP_LABEL} onPress={openSignIn} />
            ) : profile.data ? (
              <>
                <Chip label={profile.data.pseudo} onPress={() => setPseudoVisible(true)} />
                <Image source={MEDAL_IMAGE} style={styles.medal} contentFit="contain" />
              </>
            ) : null}
          </View>
        </View>

        <NewButton
          layout="hug"
          shape="rounded"
          tone="default"
          disabled={false}
          pending={false}
          icon="close"
          label={null}
          accessibilityLabel={PROFILE_CLOSE_LABEL}
          onPress={() => router.back()}
        />
      </MainHeader>

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

interface ChipProps {
  label: string;
  onPress: () => void;
}

const Chip = ({ label, onPress }: ChipProps) => {
  return (
    <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={onPress}>
      <Squircle
        radius={RADIUS.sm}
        corners="all"
        color={`${COLORS.ink}${CHIP_TINT}`}
        borderColor={null}
        borderWidth={null}
        style={styles.chip}
      >
        <Text style={styles.chipLabel}>{label}</Text>
      </Squircle>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  portraitSlot: {
    width: CONTROL_SQUARE_SIZE,
    height: CONTROL_SQUARE_SIZE + PRESS_DEPTH,
  },
  portraitEdge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: CONTROL_SQUARE_SIZE,
  },
  portrait: {
    width: CONTROL_SQUARE_SIZE,
    height: CONTROL_SQUARE_SIZE,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.ink,
    overflow: "hidden",
  },
  identity: {
    flex: 1,
    gap: SPACE.xxs,
    paddingHorizontal: SPACE.md,
  },
  name: {
    ...TEXT.rowTitle,
    color: COLORS.ink,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.xxs,
    minHeight: SPACE.xl,
  },
  chip: {
    paddingHorizontal: SPACE.xs,
    paddingVertical: SPACE.xxs,
  },
  chipLabel: {
    ...TEXT.smallText,
    color: COLORS.ink,
  },
  medal: {
    width: SPACE.md,
    aspectRatio: 237 / 393,
    marginBottom: -SPACE.xxs,
  },
  pressed: PRESSED,
});
