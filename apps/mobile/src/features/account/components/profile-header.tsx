import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { profileInitial } from "@/components/profile-initial";
import { NewButton } from "@/components/ui/new-button";
import { Squircle } from "@/components/ui/squircle";
import { useProfile } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { ProfilePortrait } from "@/features/account/components/profile-portrait";
import { PseudoSheet } from "@/features/account/components/pseudo-sheet";
import {
  PROFILE_CLOSE_LABEL,
  PROFILE_SIGNED_OUT_NAME,
  SIGN_IN_CHIP_LABEL,
} from "@/features/account/constants";
import { useSignInStore } from "@/features/account/sign-in-store";
import { avatarUrlOf, fullNameOf } from "@/features/account/user-metadata";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

// The pseudo is the Competition name, so the Competition medal sits beside it.
const MEDAL = require("../../../../assets/images/competition/medal.png");

const PORTRAIT_SIZE = 108;

const CHIP_TINT = "14";
const CHIP_HEIGHT = TEXT.body.lineHeight + SPACE.xs * 2;

export const ProfileHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.session?.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const playerId = user?.id;
  const profile = useProfile(playerId);
  const openSignIn = useSignInStore((state) => state.open);
  const [pseudoVisible, setPseudoVisible] = useState(false);

  // The restoring session is neither state yet, so the card waits rather than flash « Pas connecté ».
  const isSignedOut = !isLoading && user === undefined;
  const name = isSignedOut
    ? PROFILE_SIGNED_OUT_NAME
    : (fullNameOf(user) ?? profile.data?.pseudo ?? "");

  return (
    <View style={[styles.header, { paddingTop: insets.top + SPACE.xl }]}>
      <View>
        <FastSquircleView style={styles.card}>
          <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>
            {name}
          </Text>

          <View style={styles.chipRow}>
            {isSignedOut ? (
              <Chip label={SIGN_IN_CHIP_LABEL} onPress={openSignIn} />
            ) : profile.data ? (
              <>
                <Chip label={profile.data.pseudo} onPress={() => setPseudoVisible(true)} />
                <Image source={MEDAL} style={styles.medal} contentFit="contain" />
              </>
            ) : null}
          </View>

          <FastSquircleView style={styles.portrait}>
            <ProfilePortrait
              photoUrl={avatarUrlOf(user) ?? null}
              initial={profileInitial(profile.data?.pseudo)}
              isSignedOut={isSignedOut}
            />
          </FastSquircleView>
        </FastSquircleView>

        <View style={styles.close}>
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
        </View>
      </View>

      {playerId === undefined ? null : (
        <PseudoSheet
          playerId={playerId}
          visible={pseudoVisible}
          onDismiss={() => setPseudoVisible(false)}
        />
      )}
    </View>
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
        radius={RADIUS.lg}
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
  header: {
    paddingHorizontal: GUTTER,
  },
  card: {
    marginTop: PORTRAIT_SIZE / 1.5,
    paddingTop: PORTRAIT_SIZE / 2,
    paddingBottom: SPACE.md,
    paddingHorizontal: SPACE.lg,
    alignItems: "center",
    gap: SPACE.md,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.card,
  },
  name: {
    ...TEXT.display,
    color: COLORS.ink,
    textAlign: "center",
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.xs,
    minHeight: CHIP_HEIGHT,
  },
  chip: {
    height: CHIP_HEIGHT,
    paddingHorizontal: SPACE.sm,
    justifyContent: "center",
  },
  chipLabel: {
    ...TEXT.body,
    color: COLORS.ink,
  },
  medal: {
    width: SPACE.xl,
    aspectRatio: 243 / 408,
  },
  portrait: {
    position: "absolute",
    top: -PORTRAIT_SIZE / 1.5,
    width: PORTRAIT_SIZE,
    aspectRatio: 1,
    overflow: "hidden",
    alignItems: "center",
    borderRadius: 32,
  },
  close: {
    position: "absolute",
    top: 0,
    right: SPACE.lg,
  },
  pressed: PRESSED,
});
