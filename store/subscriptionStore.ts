import { create } from 'zustand';
import { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { getCustomerInfo, getOfferings, purchasePackage, restorePurchases } from '@/lib/purchases';

const PREMIUM_ENTITLEMENT = 'premium';

interface SubscriptionStore {
  isPremium: boolean;
  offerings: PurchasesOfferings | null;
  syncPremiumStatus: () => Promise<void>;
  loadOfferings: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<void>;
  restore: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  isPremium: false,
  offerings: null,

  syncPremiumStatus: async () => {
    const info = await getCustomerInfo();
    const active = info.entitlements.active[PREMIUM_ENTITLEMENT];
    set({ isPremium: !!active });
  },

  loadOfferings: async () => {
    const offerings = await getOfferings();
    set({ offerings });
  },

  purchase: async (pkg: PurchasesPackage) => {
    await purchasePackage(pkg);
    const info = await getCustomerInfo();
    const active = info.entitlements.active[PREMIUM_ENTITLEMENT];
    set({ isPremium: !!active });
  },

  restore: async () => {
    const info = await restorePurchases();
    const active = info.entitlements.active[PREMIUM_ENTITLEMENT];
    set({ isPremium: !!active });
  },
}));
