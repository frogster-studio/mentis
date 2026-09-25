import { create } from "zustand";

interface TransferPreviewStore {
  visible: boolean;
  open: () => void;
  close: () => void;
}

export const useTransferPreviewStore = create<TransferPreviewStore>()((set) => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
}));
