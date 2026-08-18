import { Platform, Pressable, StyleSheet, Text } from "react-native";
import { signInWithGoogle } from "@/features/account/auth";
import { GOOGLE_SIGN_IN_LABEL } from "@/features/account/constants";
import { COLORS, PRESSED, RADIUS } from "@/theme/tokens";

export type GoogleSignInButtonProps = {
  // Called when sign-in fails for a real reason (a dismissed sheet is not an error).
  onError: () => void;
};

// Self-gates to nothing on web (redirect flow comes later), so callers render it unconditionally.
export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  if (Platform.OS === "web") return null;

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={() => {
        signInWithGoogle().catch(onError);
      }}
    >
      <Text style={styles.label}>{GOOGLE_SIGN_IN_LABEL}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.quiet,
    borderColor: COLORS.stroke,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: PRESSED,
  label: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "bold",
  },
});
