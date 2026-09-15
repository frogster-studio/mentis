import { useEffect, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet, useSheetBottomInset } from "@/components/ui/sheet";
import { Squircle } from "@/components/ui/squircle";
import { useAuthStore } from "@/features/account/auth-store";
import { AppleSignInButton } from "@/features/account/components/apple-sign-in-button";
import { GoogleSignInButton } from "@/features/account/components/google-sign-in-button";
import { ProfileWash } from "@/features/account/components/profile-wash";
import { SignInHero } from "@/features/account/components/sign-in-hero";
import { SIGN_IN_ERROR } from "@/features/account/constants";
import { useSignInStore } from "@/features/account/sign-in-store";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

export const SignInSheet = () => {
  const visible = useSignInStore((state) => state.visible);
  const close = useSignInStore((state) => state.close);
  const userId = useAuthStore((state) => state.session?.user.id);
  const insets = useSafeAreaInsets();
  const bottomInset = useSheetBottomInset();
  const { height } = useWindowDimensions();
  const [signInFailed, setSignInFailed] = useState(false);
  const availableHeight = height - insets.top - SPACE.sm;

  useEffect(() => {
    if (visible) {
      setSignInFailed(false);
    }
  }, [visible]);

  // The landed session is the success signal, so the sheet leaves on its own.
  useEffect(() => {
    if (visible && userId !== undefined) {
      close();
    }
  }, [visible, userId, close]);

  return (
    <Sheet
      visible={visible}
      isBare={true}
      title={null}
      message={null}
      dismissible={true}
      onDismiss={close}
    >
      {/* The buttons keep their height; only the hero gives way on a short screen. */}
      <View
        style={[
          styles.content,
          { maxHeight: availableHeight, paddingBottom: bottomInset + GUTTER },
        ]}
      >
        <SignInHero />
        <Squircle
          radius={RADIUS.xl}
          corners="all"
          color={COLORS.background}
          borderColor={null}
          borderWidth={null}
          style={styles.actions}
        >
          <ProfileWash />
          <View style={styles.buttons}>
            {signInFailed ? <Text style={styles.error}>{SIGN_IN_ERROR}</Text> : null}
            <AppleSignInButton onError={() => setSignInFailed(true)} />
            <GoogleSignInButton onError={() => setSignInFailed(true)} />
          </View>
        </Squircle>
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: GUTTER,
    paddingHorizontal: GUTTER,
    gap: SPACE.lg,
  },
  actions: {
    flexShrink: 0,
  },
  buttons: {
    padding: SPACE.lg,
    gap: SPACE.md,
  },
  error: {
    ...TEXT.body,
    color: COLORS.danger,
    textAlign: "center",
  },
});
