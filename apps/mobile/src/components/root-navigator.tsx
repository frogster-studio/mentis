import { Stack } from "expo-router";
import { ToastHost } from "@/components/ui/toast";
import { SignInSheet } from "@/features/account/components/sign-in-sheet";
import { TransferPrompt } from "@/features/account/components/transfer-prompt";
import { useCompetitionSync } from "@/features/competition/finalize-sync";
import { PaywallSheet } from "@/features/premium/components/paywall-sheet";
import { useOutboxSync } from "@/features/quiz/outbox-sync";
import { COLORS } from "@/theme/tokens";

export const RootNavigator = () => {
  useOutboxSync();
  useCompetitionSync();

  return (
    <>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}
      >
        {/* The gate redirects off home, so onboarding must replace it rather than slide over it. */}
        <Stack.Screen name="onboarding/index" options={{ animation: "none" }} />
      </Stack>
      <TransferPrompt />
      <PaywallSheet />
      <SignInSheet />
      <ToastHost />
    </>
  );
};
