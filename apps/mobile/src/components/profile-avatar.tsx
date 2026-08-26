import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Squircle } from "@/components/ui/squircle";
import { COLORS, CONTROL_SQUARE_SIZE, RADIUS } from "@/theme/tokens";

const EDGE_DEPTH = 2;
const HEAD_SIZE = 26;

export type ProfileAvatarProps = {
  photoUrl?: string;
};

export function ProfileAvatar({ photoUrl }: ProfileAvatarProps) {
  return (
    <View style={styles.box}>
      <Squircle radius={HEAD_SIZE} color={COLORS.ink} style={styles.edge} />
      <Squircle
        radius={HEAD_SIZE}
        color={COLORS.neutral}
        style={styles.face}
        borderColor={COLORS.ink}
        borderWidth={0.2}
      >
        {photoUrl ? (
          <Image source={photoUrl} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={styles.head} />
        )}
      </Squircle>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: CONTROL_SQUARE_SIZE,
    height: CONTROL_SQUARE_SIZE + EDGE_DEPTH,
  },
  edge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: CONTROL_SQUARE_SIZE,
  },
  face: {
    width: CONTROL_SQUARE_SIZE,
    height: CONTROL_SQUARE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: CONTROL_SQUARE_SIZE,
    height: CONTROL_SQUARE_SIZE,
  },
  head: {
    width: HEAD_SIZE,
    height: HEAD_SIZE,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.face,
  },
});
