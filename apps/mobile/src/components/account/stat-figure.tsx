import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SIGN_IN_TITLE } from "@/features/account/constants";
import { useSignInStore } from "@/features/account/sign-in-store";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";
import { MEDAL_IMAGE } from "@/utils/assets";

export interface StatFigureProps {
  value: string;
  isCompetition: boolean;
  opensSignIn: boolean;
}

export const StatFigure = ({ value, isCompetition, opensSignIn }: StatFigureProps) => {
  const openSignIn = useSignInStore((state) => state.open);
  const text = <Text style={styles.value}>{value}</Text>;

  return (
    <View style={styles.row}>
      {/* The value alone is the target, so only the « -- » invites the signed-out Player in. */}
      {opensSignIn ? (
        <Pressable
          onPress={openSignIn}
          accessibilityRole="button"
          accessibilityLabel={SIGN_IN_TITLE}
          hitSlop={SPACE.xs}
          style={({ pressed }) => pressed && styles.pressed}
        >
          {text}
        </Pressable>
      ) : (
        text
      )}

      {isCompetition ? (
        <Image source={MEDAL_IMAGE} contentFit="contain" style={styles.medal} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.xs,
  },
  medal: { width: SPACE.xl, aspectRatio: 237 / 393, marginBottom: -SPACE.sm },
  value: { ...TEXT.statText, color: COLORS.ink },
  pressed: PRESSED,
});
