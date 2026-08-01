import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { signInWithApple } from "@/features/account/auth";

export type AppleSignInButtonProps = {
  // Called when sign-in fails for a real reason (a dismissed sheet is not an error).
  onError: () => void;
};

// « Continuer avec Apple » — the OS-drawn, OS-localized native button. Apple's native flow
// exists on iOS only (no Android sheet; web sign-in gets its own redirect flow later), so this
// self-gates to nothing off-iOS: callers can render it unconditionally.
export function AppleSignInButton({ onError }: AppleSignInButtonProps) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync().then(setAvailable);
  }, []);

  if (Platform.OS !== "ios" || !available) return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={12}
      style={styles.button}
      onPress={() => {
        signInWithApple().catch(onError);
      }}
    />
  );
}

const styles = StyleSheet.create({
  // The native button does not size itself — it needs an explicit frame.
  button: {
    height: 52,
    width: "100%",
  },
});
