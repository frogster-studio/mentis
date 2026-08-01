import { Platform, Pressable, StyleSheet, Text } from "react-native";
import { signInWithGoogle } from "@/features/account/auth";
import { GOOGLE_SIGN_IN_LABEL } from "@/features/account/constants";
import { COLORS } from "@/utils/colors";

export type GoogleSignInButtonProps = {
  // Called when sign-in fails for a real reason (a dismissed sheet is not an error).
  onError: () => void;
};

// « Continuer avec Google » — opens the native Google account sheet on iOS and Android. The web
// redirect flow arrives in a later slice, so this self-gates to nothing on web: callers can
// render it unconditionally. The height matches the Apple button's frame so the two providers
// line up in the footer.
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
    borderRadius: 12,
    backgroundColor: COLORS.panel,
    borderColor: COLORS.strokeStrong,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: COLORS.fill,
    fontSize: 16,
    fontWeight: "bold",
  },
});
