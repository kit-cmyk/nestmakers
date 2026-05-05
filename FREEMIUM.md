# Freemium & Premium Plan

## Philosophy

Nestmakers operates in a high-stakes, emotionally charged space — fertility journeys. The freemium model must never feel like a paywall on hope. Free users get a genuine, useful experience. Premium removes friction and surfaces signal faster. The gate is on speed and depth, not core access.

---

## Tier Overview

| | Free | Premium |
|---|---|---|
| **Price** | $0 | ~$29.99/mo · ~$199/yr |
| **Audience** | Early explorers, casual browsers | Committed users ready to move forward |
| **Core promise** | Browse, connect, match | Unlimited access + verified-first results |

---

## Feature Gating

### Browse & Discovery

| Feature | Free | Premium |
|---|---|---|
| Browse profiles | ✅ Up to 15 per day | ✅ Unlimited |
| View compatibility score | ✅ Score only | ✅ Score + full factor breakdown |
| Browse filters (role, involvement, age, country, method) | ✅ All filters | ✅ All filters |
| Verified-only filter | ⛔ | ✅ |
| Deal-breaker rules | ⛔ 1 rule max | ✅ Unlimited rules |
| Boost in others' browse decks | ⛔ Standard position | ✅ Priority placement |
| See who liked you (Interest inbox) | ⛔ Blurred / count only | ✅ Full reveal |
| Verified badge display on profile | ⛔ | ✅ |

### Likes & Matching

| Feature | Free | Premium |
|---|---|---|
| Likes per day | 10 | Unlimited |
| Personal note with like | ⛔ | ✅ |
| Undo a pass | ⛔ | ✅ (up to 3/day) |
| Match reveal screen | ✅ | ✅ + full compatibility report |

### Messaging

| Feature | Free | Premium |
|---|---|---|
| Message matched users | ✅ Up to 5 active threads | ✅ Unlimited threads |
| Message read receipts | ⛔ | ✅ |
| Message request to non-match | ⛔ | ⛔ (never — match-first is a safety boundary) |

### Profile & Trust

| Feature | Free | Premium |
|---|---|---|
| Profile photo | ✅ 1 | ✅ Up to 6 |
| Preference transparency controls | ✅ | ✅ |
| Identity verification (Onfido) | ✅ Access | ✅ Priority queue |
| "Verified" badge display | ✅ (once verified) | ✅ + boosted in browse |
| Incognito mode (browse without appearing) | ⛔ | ✅ |

### Safety & Support

| Feature | Free | Premium |
|---|---|---|
| Report / block users | ✅ | ✅ |
| Counselor screen access | ✅ | ✅ Priority response |
| Cool-down / take-a-break | ✅ | ✅ |
| Mark-success journey close | ✅ | ✅ |

---

## Paywall Moments (UX Triggers)

These are the moments in the app where the premium prompt surfaces — triggered by hitting a free-tier limit, not on app open.

| Trigger | Paywall message |
|---|---|
| 11th like attempt of the day | "You've used your 10 free likes. Upgrade to keep connecting." |
| Tapping a blurred interest inbox entry | "See who liked you — upgrade to reveal." |
| Attempting a 6th message thread | "You have 5 active conversations on the free plan. Upgrade for unlimited." |
| Applying a second deal-breaker rule | "Upgrade to set unlimited deal-breaker rules." |
| Applying the verified-only filter | "Verified-only browse is a Premium feature." |
| Adding a personal note to a like | "Personal notes are a Premium feature — they help you stand out." |
| Attempting incognito mode | "Browse privately with Premium." |
| Completing Onfido verification (verified badge display) | "Your identity is verified — upgrade to show your badge on your profile." |

**Paywall UX rules:**
- Never block the action on first attempt in a session — let one "over-limit" action through with a soft nudge.
- Paywall sheet is a bottom sheet, not a full-screen interrupt.
- Always show what they get, not what they're missing.
- No countdown timers, artificial urgency, or guilt language.

---

## RevenueCat Integration Plan

### API Keys (test)
```
iOS:     test_DQEMYwWXIwtZfTHfEEIjSeQVzTX
Android: test_DQEMYwWXIwtZfTHfEEIjSeQVzTX
```
Replace both with live keys before App Store / Play Store submission.

### Implementation Order

**Step 1 — Install**
```bash
npx expo install react-native-purchases
```
Requires a dev build (`expo-dev-client` is already in the project). Will not work in Expo Go.

**Step 2 — `lib/purchases.ts`**
Platform-aware init + identify helper. Called once from `_layout.tsx` after the Supabase session resolves. Also exposes `identifyUser(userId)` so RevenueCat ties purchases to the Supabase user ID, and `getOfferings()` / `purchasePackage()` / `restorePurchases()`.

**Step 3 — `store/subscriptionStore.ts`**
Zustand store with:
- `isPremium: boolean`
- `offerings: PurchasesOfferings | null`
- `syncPremiumStatus()` — calls `Purchases.getCustomerInfo()`, sets `isPremium` from the `premium` entitlement
- `purchasePackage(pkg)` — wraps RC purchase, syncs status after
- `restorePurchases()` — wraps RC restore, syncs status after

**Step 4 — Wire into `app/_layout.tsx`**
- Call `initPurchases()` (from `lib/purchases.ts`) inside the existing `useEffect` after session resolves, before `setIsReady(true)`.
- Call `identifyUser(session.user.id)` on auth state change (same block as push token registration).
- Call `syncPremiumStatus()` after identify.

**Step 5 — `hooks/usePremium.ts`**
```ts
export const usePremium = () => useSubscriptionStore(s => s.isPremium);
```
Import this everywhere instead of inline checks. Single source of truth.

**Step 6 — `components/PremiumSheet.tsx`**
Bottom sheet paywall triggered via a lightweight Zustand slice (`premiumSheetStore`). Accepts a `reason` string that customises the headline. Shows monthly + annual packages from `offerings`. Handles purchase and restore.

**Step 7 — RC Dashboard setup**
- Create entitlement: `premium`
- Create two products: `nestmaker_premium_monthly` · `nestmaker_premium_annual`
- Map both products to the `premium` entitlement

**Step 8 — DB sync (after RC dashboard is live)**
Supabase Edge Function at `supabase/functions/revenuecat-webhook/` handles `INITIAL_PURCHASE`, `RENEWAL`, `EXPIRATION`, `CANCELLATION` events → updates `profiles.is_premium` and `profiles.premium_expires_at`. RC sends a shared secret in the `Authorization` header; verify it in the Edge Function.

### Files Reference

| File | Status | Purpose |
|---|---|---|
| `lib/purchases.ts` | To create | RC init, identify, offerings, purchase wrappers |
| `store/subscriptionStore.ts` | To create | Premium state + sync logic |
| `hooks/usePremium.ts` | To create | Single gate hook |
| `components/PremiumSheet.tsx` | To create | Paywall bottom sheet UI |
| `app/_layout.tsx` | To modify | Wire init + identify on auth |
| `supabase/schema.sql` | To modify | Add `is_premium`, `premium_expires_at` |
| `supabase/functions/revenuecat-webhook/` | To create | Sync premium status from RC events |

---

## DB Changes Required

```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN is_premium boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN premium_expires_at timestamptz;

-- Add likes_today count (or use a view)
-- Option A: track via a daily likes view
CREATE VIEW daily_like_counts AS
  SELECT from_user_id, COUNT(*) as likes_today
  FROM likes
  WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')
  GROUP BY from_user_id;
```

RLS: `is_premium` should only be writable by a service role (the RevenueCat webhook Edge Function). Users cannot self-promote.

---

## Pricing Rationale

- **$29.99/mo** — mid-market for niche matchmaking apps; justified by the depth of the journey.
- **$199/yr** ($16.58/mo effective) — ~45% discount, strong incentive to commit. Most serious users will take this.
- No freemium-to-paid trial period initially — the free experience is generous enough to sell itself. Consider a 7-day free trial of Premium for verified users only (reward the trust signal).

---

## What Stays Free Forever

These features are **never gated**, regardless of tier:

- Creating an account and completing onboarding
- Browsing (within daily limit)
- Matching (mutual like)
- Messaging matched users (within thread limit)
- Reporting and blocking
- Identity verification access
- Safety features (cool-down, take-a-break, counselor)
- Mark-success / journey close

The principle: safety, verification, and the ability to exit are universal rights, not upsells.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `store/subscriptionStore.ts` | New — RevenueCat state, `isPremium`, offerings |
| `lib/purchases.ts` | New — RevenueCat init and helper wrappers |
| `hooks/usePremium.ts` | New — `usePremium()` hook for gating |
| `components/PremiumSheet.tsx` | New — reusable paywall bottom sheet |
| `supabase/schema.sql` | Add `is_premium`, `premium_expires_at` to profiles |
| `supabase/functions/revenuecat-webhook/` | New Edge Function — sync premium status on purchase/renewal/lapse |
| `app/_layout.tsx` | Add RevenueCat init + `<PremiumSheet />` at root |
| `app/(tabs)/browse.tsx` | Gate on daily like count (10) and profile view count (15), blurred interest inbox |
| `app/(tabs)/interest.tsx` | Blur entries beyond free limit |
| `app/(screens)/deal-breakers.tsx` | Gate beyond 1 rule |
| `app/(screens)/browse-filters.tsx` | Gate verified-only filter |
| `app/(screens)/like-compose.tsx` | Gate personal note field |
