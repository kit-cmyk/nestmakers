// Freemium gates are disabled for v1 — all users are treated as premium.
// To re-enable: remove the override and uncomment the store read.
// import { useSubscriptionStore } from '@/store/subscriptionStore';
// export const usePremium = () => useSubscriptionStore((s) => s.isPremium);

export const usePremium = () => true;
