import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { TransferPrompt } from "@/features/account/components/transfer-prompt";
import { useOutboxSync } from "@/features/quiz/outbox-sync";
import { persistOptions, queryClient } from "@/lib/query-client";
import { COLORS } from "@/theme/tokens";

export default function RootLayout() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <RootNavigator />
    </PersistQueryClientProvider>
  );
}

function RootNavigator() {
  useOutboxSync();

  return (
    <>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}
      />
      <TransferPrompt />
    </>
  );
}
