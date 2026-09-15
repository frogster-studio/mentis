import { Platform } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { signInWithGoogle } from "@/features/account/auth";
import { GOOGLE_SIGN_IN_LABEL } from "@/features/account/constants";

export interface GoogleSignInButtonProps {
  // Called when sign-in fails for a real reason (a dismissed sheet is not an error).
  onError: () => void;
}

// Self-gates to nothing on web (redirect flow comes later), so callers render it unconditionally.
export const GoogleSignInButton = ({ onError }: GoogleSignInButtonProps) => {
  if (Platform.OS === "web") return null;

  return (
    <NewButton
      layout="block"
      shape="full"
      tone="default"
      icon="google"
      label={GOOGLE_SIGN_IN_LABEL}
      accessibilityLabel={null}
      disabled={false}
      pending={false}
      onPress={() => {
        signInWithGoogle().catch((error) => {
          console.error("Google sign-in failed", error);
          onError();
        });
      }}
    />
  );
};
