import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { NewButton } from "@/components/ui/new-button";
import { Sheet } from "@/components/ui/sheet";
import { useAuthStore } from "@/features/account/auth-store";
import { AppleSignInButton } from "@/features/account/components/apple-sign-in-button";
import { GoogleSignInButton } from "@/features/account/components/google-sign-in-button";
import { SignInHero } from "@/features/account/components/sign-in-hero";
import { PROFILE_CLOSE_LABEL, SIGN_IN_ERROR } from "@/features/account/constants";
import { useSignInStore } from "@/features/account/sign-in-store";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

export const SignInSheet = () => {
  const visible = useSignInStore((state) => state.visible);
  const close = useSignInStore((state) => state.close);
  const userId = useAuthStore((state) => state.session?.user.id);
  const [signInFailed, setSignInFailed] = useState(false);

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
      <View style={styles.content}>
        <View style={styles.heroFrame}>
          <SignInHero />
          <View style={styles.close}>
            <NewButton
              layout="hug"
              shape="rounded"
              tone="default"
              disabled={false}
              pending={false}
              icon="close"
              label={null}
              accessibilityLabel={PROFILE_CLOSE_LABEL}
              onPress={close}
            />
          </View>
        </View>

        <FastSquircleView style={styles.buttons}>
          {signInFailed ? <Text style={styles.error}>{SIGN_IN_ERROR}</Text> : null}
          <AppleSignInButton onError={() => setSignInFailed(true)} />
          <GoogleSignInButton onError={() => setSignInFailed(true)} />
        </FastSquircleView>
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  content: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    gap: SPACE.lg,
    height: "100%",
  },
  heroFrame: {
    flexShrink: 1,
  },
  close: {
    position: "absolute",
    top: SPACE.md,
    right: SPACE.md,
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
