import { create } from 'zustand';

interface PremiumSheetStore {
  visible: boolean;
  reason: string;
  show: (reason?: string) => void;
  hide: () => void;
}

export const usePremiumSheetStore = create<PremiumSheetStore>((set) => ({
  visible: false,
  reason: 'Unlock everything with Premium.',
  show: (reason = 'Unlock everything with Premium.') => set({ visible: true, reason }),
  hide: () => set({ visible: false }),
}));
