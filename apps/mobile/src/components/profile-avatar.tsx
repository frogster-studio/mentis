import { StyleSheet, Text, View } from "react-native";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, RADIUS } from "@/theme/tokens";

const HEAD_SIZE = 26;

export interface ProfileAvatarProps {
  initial: string | null;
}

export const ProfileAvatar = ({ initial }: ProfileAvatarProps) => {
  return (
    <View style={styles.box}>
      {initial === null ? (
        <View style={styles.dot} />
      ) : (
        <Text style={styles.initial}>{initial}</Text>
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
    alignItems: "center",
    justifyContent: "center",
  },
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
