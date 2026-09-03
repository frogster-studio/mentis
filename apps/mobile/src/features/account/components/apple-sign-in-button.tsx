import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { signInWithApple } from "@/features/account/auth";
import { CONTROL_HEIGHT, RADIUS } from "@/theme/tokens";

export interface AppleSignInButtonProps {
  onError: () => void;
}

export const AppleSignInButton = ({ onError }: AppleSignInButtonProps) => {
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
        signInWithApple().catch((error) => {
          console.error("Apple sign-in failed", error);
          onError();
        });
      }}
    />
  );
};

const styles = StyleSheet.create({
  button: { height: CONTROL_HEIGHT, width: "100%" },
});
