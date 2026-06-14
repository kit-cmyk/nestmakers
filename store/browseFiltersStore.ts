import { create } from 'zustand';
import { InsemPref, InvolvementLevel, GiverType } from '@/types/database';

export interface BrowseFilters {
  giverTypes: GiverType[];
  insemPrefs: InsemPref[];
  involvementLevels: InvolvementLevel[];
  ageMin: number;
  ageMax: number;
  verifiedOnly: boolean;
  radiusKm: number; // 0 = any distance (filter off)
}

const DEFAULTS: BrowseFilters = {
  giverTypes: [],
  insemPrefs: [],
  involvementLevels: [],
  ageMin: 18,
  ageMax: 45,
  verifiedOnly: false,
  radiusKm: 0,
};

interface BrowseFiltersState extends BrowseFilters {
  setFilters: (f: Partial<BrowseFilters>) => void;
  reset: () => void;
  activeCount: () => number;
}

export const useBrowseFiltersStore = create<BrowseFiltersState>((set, get) => ({
  ...DEFAULTS,

  setFilters: (f) => set((s) => ({ ...s, ...f })),

  reset: () => set(DEFAULTS),

  activeCount: () => {
    const s = get();
    return (
      s.giverTypes.length +
      s.insemPrefs.length +
      s.involvementLevels.length +
      (s.ageMin !== DEFAULTS.ageMin || s.ageMax !== DEFAULTS.ageMax ? 1 : 0) +
      (s.verifiedOnly ? 1 : 0) +
      (s.radiusKm > 0 ? 1 : 0)
    );
  },
}));
