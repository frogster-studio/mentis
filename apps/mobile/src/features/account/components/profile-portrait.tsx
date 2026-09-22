import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { LogoMark } from "@/components/logo-mark";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS } from "@/theme/tokens";
import { gradient } from "@/utils/gradient";

const MARK_SIZE = 48;
const HEAD_SIZE = 50;

export interface ProfilePortraitProps {
  photoUrl: string | null;
  initial: string | null;
  isSignedOut: boolean;
}

export const ProfilePortrait = ({ photoUrl, initial, isSignedOut }: ProfilePortraitProps) => {
  if (isSignedOut) {
    return (
      <View style={[styles.circle, styles.markImage]}>
        <LogoMark color={COLORS.ink} size={MARK_SIZE} />
      </View>
    );
  }

  if (photoUrl !== null) {
    return <Image source={{ uri: photoUrl }} style={styles.circle} contentFit="cover" />;
  }

  return (
    <View style={[styles.circle, styles.markImage]}>
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
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  markImage: {
    ...gradient(
      `radial-gradient(farthest-corner at 50% 100%, ${COLORS.yellow}, ${COLORS.primary})`,
    ),
  },
  neutral: { backgroundColor: COLORS.primary },
  initial: { ...TEXT.profilePortraitInitial, color: COLORS.ink },
  head: {
    width: HEAD_SIZE,
    height: HEAD_SIZE,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.face,
  },
});
