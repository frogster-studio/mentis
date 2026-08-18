import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ScreenContainer } from "@/components/ui/screen-container";
import { signOut } from "@/features/account/auth";
import { useAuthStore } from "@/features/account/auth-store";
import { AppleSignInButton } from "@/features/account/components/apple-sign-in-button";
import { GoogleSignInButton } from "@/features/account/components/google-sign-in-button";
import {
  ACCOUNT_BACK_LABEL,
  ACCOUNT_PITCH,
  ACCOUNT_TITLE,
  DELETE_ACCOUNT_CANCEL_LABEL,
  DELETE_ACCOUNT_CONFIRM_LABEL,
  DELETE_ACCOUNT_ERROR,
  DELETE_ACCOUNT_LABEL,
  DELETE_ACCOUNT_MESSAGE,
  DELETE_ACCOUNT_TITLE,
  SIGN_IN_ERROR,
  SIGN_OUT_CANCEL_LABEL,
  SIGN_OUT_CONFIRM_LABEL,
  SIGN_OUT_LABEL,
  SIGN_OUT_MESSAGE,
  SIGN_OUT_TITLE,
} from "@/features/account/constants";
import { deleteAccount } from "@/features/account/delete-account";
import { drainOutbox } from "@/features/quiz/outbox-sync";
import { useTransferStore } from "@/features/quiz/transfer-store";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, RADIUS } from "@/theme/tokens";

export function AccountScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [signInFailed, setSignInFailed] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  // A failure leaves everything intact; the mutation's error state lets the Player retry.
  const accountDeletion = useMutation({ mutationFn: deleteAccount });

  const user = session?.user;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel={ACCOUNT_BACK_LABEL}
          hitSlop={8}
        >
          <ChevronLeft size={28} color={COLORS.ink} />
        </Pressable>
        <Text style={styles.title}>{ACCOUNT_TITLE}</Text>
        {/* Balances the back button's width so the title stays optically centered. */}
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : user ? (
        <View style={styles.body}>
          {/* The provider is never shown in v1: the email is the identity. */}
          <View style={styles.identity}>
            {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
          </View>
          <View style={styles.footer}>
            {accountDeletion.isError ? (
              <Text style={styles.error}>{DELETE_ACCOUNT_ERROR}</Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
              onPress={() => setSignOutVisible(true)}
            >
              <Text style={styles.signOutLabel}>{SIGN_OUT_LABEL}</Text>
            </Pressable>
            {/* Gated behind its own confirmation (App Store guideline 5.1.1(v)). */}
            <Pressable
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
              onPress={() => setDeleteVisible(true)}
            >
              <Text style={styles.deleteLabel}>{DELETE_ACCOUNT_LABEL}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.pitchBlock}>
            <Text style={styles.pitch}>{ACCOUNT_PITCH}</Text>
          </View>
          <View style={styles.footer}>
            {signInFailed ? <Text style={styles.error}>{SIGN_IN_ERROR}</Text> : null}
            <AppleSignInButton onError={() => setSignInFailed(true)} />
            <GoogleSignInButton onError={() => setSignInFailed(true)} />
          </View>
        </View>
      )}

      <ConfirmDialog
        visible={signOutVisible}
        title={SIGN_OUT_TITLE}
        message={SIGN_OUT_MESSAGE}
        confirmLabel={SIGN_OUT_CONFIRM_LABEL}
        cancelLabel={SIGN_OUT_CANCEL_LABEL}
        onCancel={() => setSignOutVisible(false)}
        onConfirm={async () => {
          setSignOutVisible(false);
          // Flush before the token dies — anything unpushed stays queued for the next sign-in.
          if (user) {
            await drainOutbox(user.id);
          }
          // Clear any dormancy so a still-present device world is re-offered at the next sign-in.
          useTransferStore.getState().signOut();
          await signOut();
        }}
      />

      <ConfirmDialog
        visible={deleteVisible}
        title={DELETE_ACCOUNT_TITLE}
        message={DELETE_ACCOUNT_MESSAGE}
        confirmLabel={DELETE_ACCOUNT_CONFIRM_LABEL}
        cancelLabel={DELETE_ACCOUNT_CANCEL_LABEL}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={() => {
          if (!user) return;
          setDeleteVisible(false);
          accountDeletion.mutate(user.id);
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    ...TEXT.screenTitle,
    color: COLORS.ink,
  },
  // Matches the back icon's tap target so the title is centered between them.
  headerSpacer: {
    width: 28,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // The flex fill keeps the pitch / identity near the top and pins the action to the bottom.
  body: {
    flex: 1,
    paddingHorizontal: 24,
  },
  pitchBlock: {
    flex: 1,
    paddingTop: 32,
  },
  pitch: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
  },
  identity: {
    flex: 1,
    paddingTop: 32,
  },
  email: {
    ...TEXT.body,
    color: COLORS.ink,
  },
  footer: {
    paddingBottom: 16,
    gap: 12,
  },
  error: {
    ...TEXT.body,
    color: COLORS.danger,
    textAlign: "center",
  },
  signOutButton: {
    backgroundColor: COLORS.quiet,
    borderColor: COLORS.stroke,
    borderWidth: 1,
    borderRadius: RADIUS.base,
    paddingVertical: 16,
    alignItems: "center",
  },
  pressed: PRESSED,
  signOutLabel: {
    ...TEXT.label,
    color: COLORS.ink,
  },
  // Visually secondary to sign-out, so the irreversible action never reads as the default.
  deleteButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteLabel: {
    ...TEXT.body,
    color: COLORS.danger,
  },
});
