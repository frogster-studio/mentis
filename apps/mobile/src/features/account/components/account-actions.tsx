import type { User } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { showToast } from "@/components/ui/toast";
import { signOut } from "@/features/account/auth";
import {
  DELETE_ACCOUNT_CANCEL_LABEL,
  DELETE_ACCOUNT_CONFIRM_LABEL,
  DELETE_ACCOUNT_DONE,
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
import { keepPracticeStreakSeed } from "@/features/quiz/practice-streak-seed";
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
  const accountDeletion = useMutation({
    mutationFn: deleteAccount,
    // The sign-out inside it unmounts this screen, so only the Mutation's own callback survives.
    onSuccess: () => {
      showToast(DELETE_ACCOUNT_DONE);
      router.dismissTo("/");
    },
  });

  const userId = user.id;
  // Dev only: the id keys the Account's rows on the dashboards (premium mirror, RevenueCat customer).
  useEffect(() => {
    if (__DEV__) {
      console.log(`[Profil] user id: ${userId}`);
    }
  }, [userId]);

  return (
    <View>
      <Card background={null} onPress={null}>
        <View style={styles.rows}>
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            accessibilityRole="button"
            onPress={() => setSignOutVisible(true)}
          >
            <Text style={styles.label}>{SIGN_OUT_LABEL}</Text>
          </Pressable>

          {/* App Store 3.1.1: an auto-renewing subscription needs a restore path in-app. */}
          {PURCHASES_SUPPORTED ? (
            <View style={styles.divided}>
              <RestorePurchases />
            </View>
          ) : null}

          {/* Gated behind its own confirmation (App Store guideline 5.1.1(v)). */}
          <Pressable
            style={({ pressed }) => [styles.row, styles.divided, pressed && styles.pressed]}
            accessibilityRole="button"
            onPress={() => setDeleteVisible(true)}
          >
            <Text style={[styles.label, styles.danger]}>{DELETE_ACCOUNT_LABEL}</Text>
          </Pressable>

          {accountDeletion.isError ? (
            <Text style={styles.error}>{DELETE_ACCOUNT_ERROR}</Text>
          ) : null}
        </View>
      </Card>

      <ConfirmDialog
        visible={signOutVisible}
        title={SIGN_OUT_TITLE}
        message={SIGN_OUT_MESSAGE}
        confirmLabel={SIGN_OUT_CONFIRM_LABEL}
        cancelLabel={SIGN_OUT_CANCEL_LABEL}
        onCancel={() => setSignOutVisible(false)}
        onConfirm={async () => {
          setSignOutVisible(false);
          keepPracticeStreakSeed(userId);
          // Flush before the token dies — anything unpushed stays queued for the next sign-in.
          await drainOutbox(userId);
          await signOut();
          // Cleared after the sign-out, or the still-signed-in Player is offered the transfer.
          useTransferStore.getState().signOut();
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
  rows: {
    marginVertical: -SPACE.sm,
  },
  row: {
    paddingVertical: SPACE.sm,
  },
  divided: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  label: {
    ...TEXT.body,
    color: COLORS.ink,
  },
  danger: {
    color: COLORS.danger,
  },
  error: {
    ...TEXT.body,
    color: COLORS.danger,
    paddingBottom: SPACE.sm,
  },
  pressed: PRESSED,
});
