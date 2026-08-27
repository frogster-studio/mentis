import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SheetProvider } from "@/components/ui/sheet";
import { TransferPrompt } from "@/features/account/components/transfer-prompt";
import { useCompetitionSync } from "@/features/competition/finalize-sync";
import { useOnboardingStore } from "@/features/onboarding/store";
import { useOutboxSync } from "@/features/quiz/outbox-sync";
import { persistOptions, queryClient } from "@/lib/query-client";
import { COLORS } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "EpundaSlab-Regular": require("../../assets/fonts/EpundaSlab-Regular.ttf"),
    "InterTight-Regular": require("../../assets/fonts/InterTight-Regular.ttf"),
    "InterTight-SemiBold": require("../../assets/fonts/InterTight-SemiBold.ttf"),
  });

  // A load failure still lifts the splash — the app falls back to the system font.
  const fontsSettled = Boolean(fontsLoaded || fontError);
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);
  const isReady = fontsSettled && onboardingHydrated;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <SheetProvider>
        <RootNavigator />
      </SheetProvider>
    </PersistQueryClientProvider>
  );
}

function RootNavigator() {
  useOutboxSync();
  useCompetitionSync();

  return (
    <>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}
      >
        {/* The gate redirects off home, so onboarding must replace it rather than slide over it. */}
        <Stack.Screen name="onboarding" options={{ animation: "none" }} />
      </Stack>
      <TransferPrompt />
    </>
  );
}
