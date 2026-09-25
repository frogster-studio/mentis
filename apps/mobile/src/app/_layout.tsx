import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootNavigator } from "@/components/root-navigator";
import { SheetProvider } from "@/components/ui/sheet";
import { useOnboardingStore } from "@/features/onboarding/store";
import { persistOptions, queryClient } from "@/lib/query-client";

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    "EpundaSlab-Regular": require("../../assets/fonts/EpundaSlab-Regular.ttf"),
    "EpundaSlab-Medium": require("../../assets/fonts/EpundaSlab-Medium.ttf"),
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
    <GestureHandlerRootView style={styles.root}>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <SheetProvider>
          <RootNavigator />
        </SheetProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
