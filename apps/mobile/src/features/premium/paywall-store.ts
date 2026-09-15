import { create } from "zustand";

interface PaywallStore {
  visible: boolean;
  isPreview: boolean;
  open: () => void;
  openPreview: () => void;
  close: () => void;
}

export const usePaywallStore = create<PaywallStore>()((set) => ({
  visible: false,
  isPreview: false,
  open: () => set({ visible: true, isPreview: false }),
  openPreview: () => set({ visible: true, isPreview: true }),
  close: () => set({ visible: false }),
}));
