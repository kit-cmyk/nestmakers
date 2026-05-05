import { create } from 'zustand';
import { InsemPref, InvolvementLevel } from '@/types/database';

export interface DealBreakers {
  blockedInsemPrefs: InsemPref[];
  blockedInvolvementLevels: InvolvementLevel[];
  requireAge21: boolean;
  sameCountryOnly: boolean;
}

interface DealBreakersState extends DealBreakers {
  set: (d: Partial<DealBreakers>) => void;
  reset: () => void;
  activeCount: () => number;
}

const DEFAULTS: DealBreakers = {
  blockedInsemPrefs: [],
  blockedInvolvementLevels: [],
  requireAge21: false,
  sameCountryOnly: false,
};

export const useDealBreakersStore = create<DealBreakersState>((set, get) => ({
  ...DEFAULTS,

  set: (d) => set((s) => ({ ...s, ...d })),

  reset: () => set(DEFAULTS),

  activeCount: () => {
    const s = get();
    return (
      s.blockedInsemPrefs.length +
      s.blockedInvolvementLevels.length +
      (s.requireAge21 ? 1 : 0) +
      (s.sameCountryOnly ? 1 : 0)
    );
  },
}));
