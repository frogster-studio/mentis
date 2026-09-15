import { create } from "zustand";

interface SignInStore {
  visible: boolean;
  open: () => void;
  close: () => void;
}

// One root sheet, so the paywall can hand a signed-out Player over to it.
export const useSignInStore = create<SignInStore>()((set) => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
}));
