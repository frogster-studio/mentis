import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QuietButton } from "@/components/ui/quiet-button";
import { ALL_SCREEN_EDGES, ScreenContainer } from "@/components/ui/screen-container";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { useProfile } from "@/features/account/api";
import { signOut } from "@/features/account/auth";
import { useAuthStore } from "@/features/account/auth-store";
import { AppleSignInButton } from "@/features/account/components/apple-sign-in-button";
import { GoogleSignInButton } from "@/features/account/components/google-sign-in-button";
import { PseudoSheet } from "@/features/account/components/pseudo-sheet";
import { TransferNotice } from "@/features/account/components/transfer-notice";
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
import { PaywallModal } from "@/features/premium/components/paywall-modal";
import { PremiumCard } from "@/features/premium/components/premium-card";
import { useIsPremium } from "@/features/premium/use-is-premium";
import { HomeEmptyState } from "@/features/quiz/components/home-empty-state";
import { HomeThemeCard } from "@/features/quiz/components/home-theme-card";
import { drainOutbox } from "@/features/quiz/outbox-sync";
import { useTransferStore } from "@/features/quiz/transfer-store";
import { useHomeCards } from "@/features/quiz/use-home-cards";
import { PURCHASES_SUPPORTED } from "@/lib/purchases";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, GUTTER, PRESSED, SPACE } from "@/theme/tokens";

export const AccountScreen = () => {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [signInFailed, setSignInFailed] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [pseudoVisible, setPseudoVisible] = useState(false);
  const isPremium = useIsPremium();
  // A failure leaves everything intact; the mutation's error state lets the Player retry.
  const accountDeletion = useMutation({ mutationFn: deleteAccount });

  const user = session?.user;
  const userId = user?.id;
  // Dev only: the id keys the Account's rows on the dashboards (premium mirror, RevenueCat customer).
  useEffect(() => {
    if (__DEV__ && userId !== undefined) {
      console.log(`[Compte] user id: ${userId}`);
    }
  }, [userId]);
  const profile = useProfile(userId);
  const cards = useHomeCards();
  const transferred = useTransferStore((state) => state.transferred);
  const dismissed = useTransferStore((state) => state.dismissed);
  const isEmpty = cards.length === 0;

  // The signed-out shelf is empty because the stats moved, not because nothing was ever played.
  const showTransferNotice = !user && transferred && isEmpty && !dismissed;

  return (
    <ScreenContainer edges={ALL_SCREEN_EDGES} underlay={null}>
      <View style={styles.header}>
        <QuietButton
          layout="circle"
          label={null}
          icon="chevron-left"
          accessibilityLabel={ACCOUNT_BACK_LABEL}
          onPress={() => router.back()}
          disabled={false}
        />
        <Text style={styles.title}>{ACCOUNT_TITLE}</Text>
        {/* Balances the back circle, so the title holds the screen's centre line. */}
        <View style={styles.spacer} />
      </View>

      {isLoading ? (
        <ScreenLoading />
      ) : (
        <View style={styles.body}>
          <ScrollView
            style={styles.shelfScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.shelf}
          >
            {/* The provider is never shown in v1: the email is the identity. */}
            {user ? (
              <View style={styles.identity}>
                {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
                {profile.data ? (
                  <Pressable
                    style={({ pressed }) => pressed && styles.pressed}
                    onPress={() => setPseudoVisible(true)}
                  >
                    <Text style={styles.pseudo}>{profile.data.pseudo}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <Text style={styles.pitch}>{ACCOUNT_PITCH}</Text>
            )}
            {user && PURCHASES_SUPPORTED && isPremium !== null ? (
              <PremiumCard isPremium={isPremium} onOpenPaywall={() => setPaywallVisible(true)} />
            ) : null}
            {showTransferNotice ? <TransferNotice /> : null}
            {isEmpty ? (
              <HomeEmptyState />
            ) : (
              cards.map((card) => (
                <HomeThemeCard
                  key={card.id}
                  name={card.name}
                  average={card.average}
                  sessionCount={card.sessionCount}
                  category={card.category ?? null}
                />
              ))
            )}
          </ScrollView>
          <View style={styles.footer}>
            {user ? (
              <>
                {accountDeletion.isError ? (
                  <Text style={styles.error}>{DELETE_ACCOUNT_ERROR}</Text>
                ) : null}
                <QuietButton
                  layout="block"
                  label={SIGN_OUT_LABEL}
                  icon={null}
                  accessibilityLabel={null}
                  onPress={() => setSignOutVisible(true)}
                  disabled={false}
                />
                {/* Gated behind its own confirmation (App Store guideline 5.1.1(v)). */}
                <Pressable
                  style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                  onPress={() => setDeleteVisible(true)}
                >
                  <Text style={styles.deleteLabel}>{DELETE_ACCOUNT_LABEL}</Text>
                </Pressable>
              </>
            ) : (
              <>
                {signInFailed ? <Text style={styles.error}>{SIGN_IN_ERROR}</Text> : null}
                <AppleSignInButton onError={() => setSignInFailed(true)} />
                <GoogleSignInButton onError={() => setSignInFailed(true)} />
              </>
            )}
          </View>
        </View>
      )}

      <PaywallModal visible={paywallVisible} onDismiss={() => setPaywallVisible(false)} />

      {userId ? (
        <PseudoSheet
          playerId={userId}
          visible={pseudoVisible}
          onDismiss={() => setPseudoVisible(false)}
        />
      ) : null}

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
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: GUTTER,
    paddingVertical: SPACE.md,
  },
  title: {
    ...TEXT.screenTitle,
    flex: 1,
    color: COLORS.ink,
    textAlign: "center",
  },
  spacer: {
    width: CONTROL_HEIGHT,
  },
  // The flex fill keeps the shelf near the top and pins the action to the bottom.
  body: {
    flex: 1,
    paddingHorizontal: GUTTER,
  },
  shelfScroll: {
    flex: 1,
  },
  shelf: {
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.lg,
    gap: SPACE.md,
  },
  pitch: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
  },
  identity: {
    gap: SPACE.xxs,
  },
  email: {
    ...TEXT.body,
    color: COLORS.ink,
  },
  pseudo: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
  },
  footer: {
    paddingBottom: GUTTER,
    gap: SPACE.md,
  },
  error: {
    ...TEXT.body,
    color: COLORS.danger,
    textAlign: "center",
  },
  pressed: PRESSED,
  // Visually secondary to sign-out, so the irreversible action never reads as the default.
  deleteButton: {
    paddingVertical: SPACE.md,
    alignItems: "center",
  },
  deleteLabel: {
    ...TEXT.body,
    color: COLORS.danger,
  },
});
