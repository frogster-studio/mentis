import { create } from "zustand";

interface SignInStore {
  visible: boolean;
  open: () => void;
  close: () => void;
}

// One root sheet, opened from wherever a signed-out Player is invited in.
export const useSignInStore = create<SignInStore>()((set) => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
}));
