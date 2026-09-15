import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { LogoMark } from "@/components/logo-mark";
import { PaywallHeroGradient } from "@/features/premium/components/paywall-hero-gradient";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS } from "@/theme/tokens";

export const PORTRAIT_SIZE = 115;
const MARK_SIZE = 64;
const HEAD_SIZE = 50;

export interface ProfilePortraitProps {
  photoUrl: string | null;
  initial: string | null;
  isSignedOut: boolean;
}

export const ProfilePortrait = ({ photoUrl, initial, isSignedOut }: ProfilePortraitProps) => {
  if (isSignedOut) {
    return (
      <View style={[styles.circle, styles.clip]}>
        <PaywallHeroGradient />
        <LogoMark color={COLORS.ink} size={MARK_SIZE} />
      </View>
    );
  }

  if (photoUrl !== null) {
    return <Image source={{ uri: photoUrl }} style={styles.circle} contentFit="cover" />;
  }

  return (
    <View style={[styles.circle, styles.neutral]}>
      {initial === null ? (
        <View style={styles.head} />
      ) : (
        <Text style={styles.initial}>{initial}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
    borderRadius: RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
  },
  clip: {
    overflow: "hidden",
  },
  neutral: {
    borderWidth: 1,
    borderColor: COLORS.inkMuted,
    backgroundColor: COLORS.neutral,
  },
  initial: {
    ...TEXT.display,
    color: COLORS.ink,
  },
  head: {
    width: HEAD_SIZE,
    height: HEAD_SIZE,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.face,
  },
});
