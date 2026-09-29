import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SIGN_IN_TITLE } from "@/features/account/constants";
import { useSignInStore } from "@/features/account/sign-in-store";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";

const MEDAL_IMAGE = require("../../../assets/images/competition/medal.png");

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
      {isCompetition ? (
        <Image source={MEDAL_IMAGE} contentFit="contain" style={styles.medal} />
      ) : null}
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
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: SPACE.xs },
  medal: { width: SPACE.md, aspectRatio: 243 / 408 },
  value: { ...TEXT.statValue, color: COLORS.ink },
  pressed: PRESSED,
});
