import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { signInWithApple } from "@/features/account/auth";
import { AppleMark } from "@/features/account/components/apple-mark";
import { APPLE_SIGN_IN_LABEL } from "@/features/account/constants";
import { COLORS, CONTROL_ICON_SIZE } from "@/theme/tokens";

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
    <NewButton
      layout="block"
      shape="full"
      tone="inverse"
      icon={<AppleMark color={COLORS.face} size={CONTROL_ICON_SIZE} />}
      label={APPLE_SIGN_IN_LABEL}
      accessibilityLabel={null}
      disabled={false}
      pending={false}
      onPress={() => {
        signInWithApple().catch((error) => {
          console.error("Apple sign-in failed", error);
          onError();
        });
      }}
    />
  );
};
