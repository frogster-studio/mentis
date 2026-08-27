import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { COLORS, CONTROL_SQUARE_SIZE, RADIUS } from "@/theme/tokens";

const HEAD_SIZE = 26;

export interface ProfileAvatarProps {
  photoUrl: string | null;
}

export const ProfileAvatar = ({ photoUrl }: ProfileAvatarProps) => {
  return (
    <View style={styles.box}>
      {photoUrl ? (
        <Image source={"https://picsum.photos/200/300"} style={styles.photo} contentFit="cover" />
      ) : (
        <View style={styles.dot} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    width: CONTROL_SQUARE_SIZE,
    height: CONTROL_SQUARE_SIZE,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.inkMuted,
    backgroundColor: COLORS.neutral,
    overflow: "hidden",
    position: "relative",
  },
  photo: { flex: 1 },
  dot: {
    backgroundColor: COLORS.face,
    height: HEAD_SIZE,
    width: HEAD_SIZE,
    borderRadius: RADIUS.round,
    margin: "auto",
  },
});
