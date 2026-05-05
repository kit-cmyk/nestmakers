# Matchmaking System

## Overview

Nestmaker's matchmaking is a multi-layer funnel: hard database constraints → soft browse filters → deal-breaker auto-declines → user-driven likes → mutual-like match creation.

The core model is **directional interest** — a user likes another profile, and a match is only created when both parties have liked each other (mutual like). Discovery is browse-based with filters. Profiles are ranked by compatibility score so best matches surface first in the deck.

---

## Data Model

### Tables

| Table | Purpose |
|---|---|
| `profiles` | User data, preferences, and eligibility fields |
| `likes` | Directional interest records (`from_user_id → to_user_id`) |
| `matches` | Auto-created when a mutual like is detected |
| `threads` | One conversation thread per match, auto-created with match |
| `browse_passes` | Persists swipe-left decisions; passed profiles are excluded from future browse results |
| `profile_views` | Records each time a user opens a profile detail page; drives the unseen-profile ranking boost |

### Key Profile Fields Used in Matching

| Field | Values |
|---|---|
| `role` | `seeker`, `giver`, `both` |
| `giver_type` | `egg`, `sperm`, `womb`, `embryo` |
| `insemination_preference` | `ai`, `ni`, `both` |
| `involvement_level` | `anonymous` → `identity_release` → `limited_contact` → `known_donor` → `co_parenting` |
| `verification_status` | `pending`, `verified`, `rejected` |

---

## Matching Layers

### 1. Hard Constraints (Database)

Enforced at the schema level — cannot be bypassed by the client.

- **Role compatibility**: seekers see givers/both, givers see seekers/both — enforced in `get_browse_profiles` SQL
- **No self-match**: `p_user_id != pp.id` in `get_browse_profiles`
- **No re-like**: `likes` table has a unique constraint on `(from_user_id, to_user_id)`
- **Mutual like required**: a `matches` row is only created by the `handle_mutual_like()` trigger

#### `handle_mutual_like()` Trigger (`schema.sql:169-201`)

Fires `AFTER INSERT` on `likes`. Logic:
1. Check if the reverse like already exists (`to_user_id → from_user_id`)
2. If yes, insert a row into `matches` using canonical order (smaller UUID first, for deduplication)
3. Immediately create an associated `threads` row for the new match

### 2. Soft Browse Filters (Client)

Applied when loading profiles for the browse feed. User-configurable via the filters screen.

| Filter | Default | Handled in |
|---|---|---|
| Role | auto (seeker↔giver) | `get_browse_profiles` SQL |
| Involvement tier | any | `browse-filters.tsx` → RPC param |
| Insemination preference | any | `browse-filters.tsx` → RPC param |
| Age range | 18–45 | `browse-filters.tsx` → RPC param |
| Verified only | off | `browse-filters.tsx` → RPC param |
| Results per fetch | 20 | `p_limit` param |
| Ranking | compatibility score (desc), then join date | `get_browse_profiles` SQL |

### 3. Deal-Breakers (Auto-Decline Rules)

Configured by the user in `deal-breakers.tsx`. Profiles matching any active deal-breaker are automatically excluded from browse results before the user sees them.

| Deal-Breaker | Logic |
|---|---|
| Verified only | exclude unverified profiles |
| Insemination method | exclude profiles with rejected method |
| Involvement level | exclude profiles with rejected involvement tier |
| Minimum age | exclude profiles under specified age (min 21) |
| Same country | exclude profiles outside user's country |

### 4. User-Driven Like / Pass

The primary matching action. Implemented in `browse.tsx` (`sendLike()` / `recordPass()`):

- **Like** — upserts a row in `likes`, triggers push notification to recipient
- **Pass** — upserts a row in `browse_passes`; the profile is excluded from all future browse results for this user via the SQL ranking function
- Both use upsert semantics to handle rapid swiping safely

---

## Compatibility Scoring

Scoring runs in two places with slightly different purposes:

### TypeScript — `lib/compatibility.ts` (max 100)

Used in **match-reveal** (full report card) and **like-compose** (summary pill). Based entirely on static profile fields.

| Factor | Max pts | Logic |
|---|---|---|
| Insemination preference | 30 | Full match if either chose `both`, or exact match |
| Involvement level proximity | 30 | 30 at gap=0, 20 at gap=1, 10 at gap=2, 0 beyond |
| Same country | 20 | Exact `country` field match |
| Combined experience | 20 | 20 if ≥3 journeys combined, 10 if ≥1, 0 if none |

`compatSummary(mine, theirs)` returns a compact string (e.g. `"AI · 1 tier apart · Australia"`) used in the like-compose pill.

### SQL — `get_browse_profiles` RPC (max 120)

Used to **rank the browse feed**. Mirrors the TypeScript factors and adds two behavioural boosts:

| Factor | Max pts | Logic |
|---|---|---|
| Insemination preference | 30 | Same as TypeScript |
| Involvement level proximity | 30 | Same as TypeScript |
| Same country | 20 | Same as TypeScript |
| Combined experience | 20 | Same as TypeScript |
| New-member boost | 10 | Profile created within last 14 days |
| Unseen-profile boost | 5 | Viewer has no row in `profile_views` for this profile |
| Bio completeness | 5 | `bio` is non-null and longer than 10 characters |

---

## Match Reveal

When a mutual like creates a match, users are shown `match-reveal.tsx`:

- Animated dual-portrait reveal with heart animation
- Live compatibility report: score (0–100) and top 3 factors from `scoreCompatibility()`
- Score is computed at render time from real profile data — not hardcoded

---

## Interest Inbox

`interest.tsx` and `intent-inbox.tsx` manage inbound interest:

- Queries live `likes` rows where `to_user_id = current user`, excluding passed and already-matched entries
- Tabs: All / Liked You / Matched
- Pass writes `passed_at` timestamp to the `likes` row (persisted across sessions)
- Match button upserts a return like, triggering `handle_mutual_like()` and navigating to match-reveal
- Real-time `postgres_changes` subscription refreshes the feed on new likes or matches

---

## Preference Transparency

Users control which fields are visible on their browse card (`preference-transparency.tsx`). Hiding a field removes it from the card UI but **does not affect matching** — the underlying filter logic still uses the field value.

---

## What's Not Yet Built

| Gap | Notes |
|---|---|
| Response-rate signal | Message-back rate (did they reply?) would be a strong ranking signal but requires aggregating message data per user |
| Pagination beyond 20 | `get_browse_profiles` supports `p_offset` but the client doesn't yet request a second page when the deck empties mid-session |

---

## Files Reference

| File | Role |
|---|---|
| `supabase/schema.sql:169-201` | `handle_mutual_like()` trigger — core match creation |
| `app/(tabs)/browse.tsx` | Browse feed, like/pass actions; calls `get_browse_profiles` RPC |
| `app/(screens)/browse-filters.tsx` | User-configurable soft filters |
| `app/(screens)/deal-breakers.tsx` | Auto-decline rule configuration |
| `app/(screens)/match-reveal.tsx` | Post-match reveal screen |
| `app/(tabs)/interest.tsx` | Inbound interest feed |
| `app/(screens)/intent-inbox.tsx` | Accept/pass workflow for inbound likes |
| `lib/compatibility.ts` | `scoreCompatibility()` and `compatSummary()` — TypeScript scoring (match-reveal + like-compose) |
| `supabase/ranking.sql` | `get_browse_profiles()` RPC, `record_profile_view()` RPC, `profile_views` table, `browse_passes` table |
| `app/(screens)/like-compose.tsx` | Like composition — fetches target profile, renders live compat pill |
| `app/(onboarding)/involvement.tsx` | Involvement tier selection + tier-gap filter explanation |
| `app/(screens)/preference-transparency.tsx` | Visibility controls for profile fields |
| `types/database.ts` | TypeScript profile interface with all matchable fields |
