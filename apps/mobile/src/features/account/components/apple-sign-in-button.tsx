import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { signInWithApple } from "@/features/account/auth";
import { CONTROL_HEIGHT, RADIUS } from "@/theme/tokens";

export type AppleSignInButtonProps = {
  // Called when sign-in fails for a real reason (a dismissed sheet is not an error).
  onError: () => void;
};

// The native flow exists on iOS only, so this self-gates and callers render it unconditionally.
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
      cornerRadius={RADIUS.base}
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
    height: CONTROL_HEIGHT,
    width: "100%",
  },
});
