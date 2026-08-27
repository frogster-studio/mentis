import { Platform } from "react-native";
import { QuietButton } from "@/components/ui/quiet-button";
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
    <QuietButton
      layout="block"
      label={GOOGLE_SIGN_IN_LABEL}
      icon={null}
      accessibilityLabel={null}
      onPress={() => {
        signInWithGoogle().catch(onError);
      }}
      disabled={false}
    />
  );
};
