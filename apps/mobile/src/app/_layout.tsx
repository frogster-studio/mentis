import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { TransferPrompt } from "@/features/account/components/transfer-prompt";
import { useOutboxSync } from "@/features/quiz/outbox-sync";
import { persistOptions, queryClient } from "@/lib/query-client";
import { COLORS } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Lexend-Bold": require("../../assets/fonts/Lexend-Bold.ttf"),
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
  });

  // A load failure still lifts the splash — the app falls back to the system font.
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

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
