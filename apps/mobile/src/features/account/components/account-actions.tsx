import type { User } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QuietButton } from "@/components/ui/quiet-button";
import { signOut } from "@/features/account/auth";
import {
  DELETE_ACCOUNT_CANCEL_LABEL,
  DELETE_ACCOUNT_CONFIRM_LABEL,
  DELETE_ACCOUNT_ERROR,
  DELETE_ACCOUNT_LABEL,
  DELETE_ACCOUNT_TITLE,
  deleteAccountMessage,
  SIGN_OUT_CANCEL_LABEL,
  SIGN_OUT_CONFIRM_LABEL,
  SIGN_OUT_LABEL,
  SIGN_OUT_MESSAGE,
  SIGN_OUT_TITLE,
} from "@/features/account/constants";
import { deleteAccount } from "@/features/account/delete-account";
import { RestorePurchases } from "@/features/premium/components/restore-purchases";
import { drainOutbox } from "@/features/quiz/outbox-sync";
import { useTransferStore } from "@/features/quiz/transfer-store";
import { PURCHASES_SUPPORTED } from "@/lib/purchases";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";

export interface AccountActionsProps {
  user: User;
  isPremium: boolean | null;
}

export const AccountActions = ({ user, isPremium }: AccountActionsProps) => {
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  // A failure leaves everything intact; the mutation's error state lets the Player retry.
  const accountDeletion = useMutation({ mutationFn: deleteAccount });

  const userId = user.id;
  // Dev only: the id keys the Account's rows on the dashboards (premium mirror, RevenueCat customer).
  useEffect(() => {
    if (__DEV__) {
      console.log(`[Profil] user id: ${userId}`);
    }
  }, [userId]);

  return (
    <View style={styles.actions}>
      {accountDeletion.isError ? <Text style={styles.error}>{DELETE_ACCOUNT_ERROR}</Text> : null}
      <QuietButton
        layout="block"
        label={SIGN_OUT_LABEL}
        icon={null}
        accessibilityLabel={null}
        onPress={() => setSignOutVisible(true)}
        disabled={false}
      />
      {/* App Store 3.1.1: an auto-renewing subscription needs a restore path in-app. */}
      {PURCHASES_SUPPORTED ? <RestorePurchases /> : null}
      {/* Gated behind its own confirmation (App Store guideline 5.1.1(v)). */}
      <Pressable
        style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
        onPress={() => setDeleteVisible(true)}
      >
        <Text style={styles.deleteLabel}>{DELETE_ACCOUNT_LABEL}</Text>
      </Pressable>

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
          await drainOutbox(userId);
          // Clear any dormancy so a still-present device world is re-offered at the next sign-in.
          useTransferStore.getState().signOut();
          await signOut();
        }}
      />

      <ConfirmDialog
        visible={deleteVisible}
        title={DELETE_ACCOUNT_TITLE}
        message={deleteAccountMessage(isPremium)}
        confirmLabel={DELETE_ACCOUNT_CONFIRM_LABEL}
        cancelLabel={DELETE_ACCOUNT_CANCEL_LABEL}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={() => {
          setDeleteVisible(false);
          accountDeletion.mutate(userId);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  actions: {
    gap: SPACE.md,
  },
  error: {
    ...TEXT.body,
    color: COLORS.danger,
    textAlign: "center",
  },
  // Visually secondary to sign-out, so the irreversible action never reads as the default.
  deleteButton: {
    paddingVertical: SPACE.md,
    alignItems: "center",
  },
  deleteLabel: {
    ...TEXT.body,
    color: COLORS.danger,
  },
  pressed: PRESSED,
});
