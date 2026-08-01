import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { TransferPrompt } from "@/features/account/components/transfer-prompt";
import { useOutboxSync } from "@/features/quiz/outbox-sync";
import { persistOptions, queryClient } from "@/lib/query-client";
import { COLORS } from "@/utils/colors";

export default function RootLayout() {
  // Pushes the signed-in Account's queued sessions on the PRD rhythm — at launch, on foreground and
  // at sign-in. Mounted once here so the sync outlives any individual screen. A no-op signed out.
  useOutboxSync();

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.surface },
        }}
      />
      {/* The Stats Transfer offer, mounted once at the root so it appears over whatever screen the
          Player signed in from. Self-contained: it shows itself only when the offer predicate holds. */}
      <TransferPrompt />
    </PersistQueryClientProvider>
  );
}
