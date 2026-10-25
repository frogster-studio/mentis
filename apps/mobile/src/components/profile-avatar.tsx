import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { Skeleton } from "@/components/ui/skeleton";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, RADIUS } from "@/theme/tokens";

const HEAD_SIZE = 26;

export interface ProfileAvatarProps {
  photoUrl: string | null;
  initial: string | null;
}

export const ProfileAvatar = ({ photoUrl, initial }: ProfileAvatarProps) => {
  const [decodedUrl, setDecodedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (photoUrl !== null && photoUrl !== failedUrl) {
    return (
      <FastSquircleView style={styles.box}>
        <Image
          source={{ uri: photoUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="disk"
          onLoad={() => setDecodedUrl(photoUrl)}
          onError={() => setFailedUrl(photoUrl)}
        />
        {photoUrl === decodedUrl ? null : (
          <Skeleton
            radius={RADIUS.base}
            isOnDark={false}
            isFrozen={false}
            style={StyleSheet.absoluteFill}
          />
        )}
      </FastSquircleView>
    );
  }

  return (
    <FastSquircleView style={[styles.box, styles.initialFace]}>
      {initial === null ? (
        <View style={styles.dot} />
      ) : (
        <Text style={styles.initial}>{initial}</Text>
      )}
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  box: {
    width: CONTROL_SQUARE_SIZE,
    height: CONTROL_SQUARE_SIZE,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.inkMuted,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  initialFace: { backgroundColor: COLORS.neutral },
  initial: {
    ...TEXT.statValue,
    color: COLORS.ink,
  },
  dot: {
    backgroundColor: COLORS.face,
    height: HEAD_SIZE,
    width: HEAD_SIZE,
    borderRadius: RADIUS.round,
  },
});
