import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// The static web prerender runs in Node, where AsyncStorage's localStorage shim finds no window.
const isPrerender = typeof window === "undefined";

const prerenderStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

type OnboardingStore = {
  // The splash waits on this, so home never renders before the flag is known.
  hasHydrated: boolean;
  hasOnboarded: boolean;
  // Pressing « Commencer » is the legal acceptance, and this records it for the device's lifetime.
  complete: () => void;
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasHydrated: false,
      hasOnboarded: false,
      complete: () => set({ hasOnboarded: true }),
    }),
    {
      name: "mentis-onboarding",
      storage: createJSONStorage(() => (isPrerender ? prerenderStorage : AsyncStorage)),
      partialize: (state) => ({ hasOnboarded: state.hasOnboarded }),
      // A failed read lifts the splash all the same: welcoming twice beats never leaving the splash.
      onRehydrateStorage: () => () => useOnboardingStore.setState({ hasHydrated: true }),
    },
  ),
);
