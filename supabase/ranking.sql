-- Nestmakers — server-side ranked browse feed + behavioural signal tables.
-- Run in the Supabase SQL editor AFTER schema.sql.
-- Safe to re-run: all statements are idempotent.

-- ─── patch public_profiles view ──────────────────────────────────────────────
-- Adds prompts and profile_photo_urls that schema.sql omitted.
-- The ranking function's return type depends on this view's column list.
drop view if exists public_profiles;
create view public_profiles
with (security_invoker = false) as
select
  id,
  first_name,
  display_name,
  is_anonymous,
  date_of_birth,
  country,
  role,
  giver_types,
  insemination_preference,
  involvement_level,
  bio,
  prompts,
  ethnicity,
  education,
  hair_color,
  eye_color,
  blood_type,
  alcohol_frequency,
  smoking_frequency,
  drug_frequency,
  profile_photo_url,
  profile_photo_urls,
  verification_status,
  is_active,
  onboarding_complete,
  journeys_completed,
  created_at,
  updated_at
from profiles
where is_active = true
  and onboarding_complete = true;

grant select on public_profiles to authenticated;

-- ─── profile_views ───────────────────────────────────────────────────────────
-- Each row records that viewer_id opened the detail page for viewed_id.
-- Used as a ranking signal: unseen profiles get a +5 boost in get_browse_profiles.
create table if not exists profile_views (
  id              uuid default uuid_generate_v4() primary key,
  viewer_id       uuid references profiles(id) on delete cascade not null,
  viewed_id       uuid references profiles(id) on delete cascade not null,
  first_viewed_at timestamptz default now() not null,
  last_viewed_at  timestamptz default now() not null,
  unique(viewer_id, viewed_id)
);

alter table profile_views enable row level security;

drop policy if exists "profile_views_select_own" on profile_views;
create policy "profile_views_select_own" on profile_views
  for select using (viewer_id = auth.uid());

drop policy if exists "profile_views_insert_own" on profile_views;
create policy "profile_views_insert_own" on profile_views
  for insert with check (viewer_id = auth.uid());

drop policy if exists "profile_views_update_own" on profile_views;
create policy "profile_views_update_own" on profile_views
  for update using (viewer_id = auth.uid());

-- ─── browse_passes ───────────────────────────────────────────────────────────
-- Persists swipe-left decisions so passed profiles never resurface.
create table if not exists browse_passes (
  id           uuid default uuid_generate_v4() primary key,
  from_user_id uuid references profiles(id) on delete cascade not null,
  to_user_id   uuid references profiles(id) on delete cascade not null,
  created_at   timestamptz default now() not null,
  unique(from_user_id, to_user_id)
);

alter table browse_passes enable row level security;

drop policy if exists "browse_passes_insert_own" on browse_passes;
create policy "browse_passes_insert_own" on browse_passes
  for insert with check (from_user_id = auth.uid());

drop policy if exists "browse_passes_select_own" on browse_passes;
create policy "browse_passes_select_own" on browse_passes
  for select using (from_user_id = auth.uid());

-- ─── record_profile_view ─────────────────────────────────────────────────────
-- Fire-and-forget from the profile detail screen.
-- Uses auth.uid() so the client never needs to pass the viewer ID.
create or replace function record_profile_view(p_viewed_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  insert into profile_views (viewer_id, viewed_id, last_viewed_at)
  values (auth.uid(), p_viewed_id, now())
  on conflict (viewer_id, viewed_id)
  do update set last_viewed_at = now();
end;
$$;

grant execute on function record_profile_view(uuid) to authenticated;

-- ─── get_browse_profiles ─────────────────────────────────────────────────────
-- Returns up to p_limit profiles ranked by compatibility score.
-- All filtering (role compat, soft filters, deal-breakers) is applied here so
-- the client sends one RPC call instead of a multi-step query chain.
--
-- Score breakdown (max 120):
--   30  insemination preference match
--   30  involvement level proximity (30 / 20 / 10 for gap 0 / 1 / 2)
--   20  same country
--   20  combined journeys completed (≥3 → 20, ≥1 → 10)
--   10  joined within last 14 days  (new-member boost)
--    5  has a meaningful bio
--    5  not yet viewed by this user  (unseen-profile boost)
create or replace function get_browse_profiles(
  p_user_id       uuid,
  p_giver_types   text[]  default null,
  p_insem_prefs   text[]  default null,
  p_involvement   text[]  default null,
  p_verified_only boolean default false,
  p_dob_min       date    default null,
  p_dob_max       date    default null,
  p_blocked_insem text[]  default null,
  p_blocked_inv   text[]  default null,
  p_require_age21 boolean default false,
  p_same_country  boolean default false,
  p_limit         integer default 20,
  p_offset        integer default 0
)
returns setof public_profiles
language plpgsql
security definer
as $$
declare
  me          profiles%rowtype;
  inv_order   text[] := array[
    'anonymous', 'identity_release', 'limited_contact', 'known_donor', 'co_parenting'
  ];
  cutoff_21   date := (current_date - interval '21 years')::date;
begin
  select * into me from profiles where id = p_user_id;

  return query
  with scored as (
    select
      pp.*,
      (
        -- insemination match (30 pts)
        case
          when pp.insemination_preference = 'both'
            or me.insemination_preference = 'both'       then 30
          when pp.insemination_preference
               = me.insemination_preference              then 30
          else 0
        end
        +
        -- involvement proximity (30 pts)
        case abs(
          coalesce(array_position(inv_order, pp.involvement_level), 2) -
          coalesce(array_position(inv_order, me.involvement_level), 2)
        )
          when 0 then 30
          when 1 then 20
          when 2 then 10
          else    0
        end
        +
        -- same country (20 pts)
        case
          when me.country is not null and pp.country = me.country then 20
          else 0
        end
        +
        -- combined journeys (20 pts)
        case
          when coalesce(pp.journeys_completed, 0)
             + coalesce(me.journeys_completed, 0) >= 3   then 20
          when coalesce(pp.journeys_completed, 0)
             + coalesce(me.journeys_completed, 0) >= 1   then 10
          else 0
        end
        +
        -- new-member boost (10 pts)
        case
          when pp.created_at > now() - interval '14 days' then 10
          else 0
        end
        +
        -- bio completeness (5 pts)
        case
          when pp.bio is not null and length(pp.bio) > 10 then 5
          else 0
        end
        +
        -- unseen-profile boost (5 pts)
        case
          when not exists (
            select 1 from profile_views pv
            where pv.viewer_id = p_user_id and pv.viewed_id = pp.id
          ) then 5
          else 0
        end
      ) as compat_score
    from public_profiles pp
    where
      pp.id != p_user_id

      -- exclude profiles already liked by this user
      and not exists (
        select 1 from likes l
        where l.from_user_id = p_user_id and l.to_user_id = pp.id
      )
      -- exclude users this user has blocked
      and not exists (
        select 1 from blocked_users bu
        where bu.blocker_id = p_user_id and bu.blocked_id = pp.id
      )
      -- exclude browse passes (swipe-left history)
      and not exists (
        select 1 from browse_passes bp
        where bp.from_user_id = p_user_id and bp.to_user_id = pp.id
      )

      -- role compatibility (mirrors browse.tsx logic)
      and (
        me.role = 'both'
        or (me.role = 'seeker' and pp.role in ('giver', 'both'))
        or (me.role = 'giver'  and pp.role in ('seeker', 'both'))
      )

      -- soft filters (null param = no filter)
      and (p_giver_types  is null or pp.giver_types && p_giver_types)
      and (p_insem_prefs  is null or pp.insemination_preference = any(p_insem_prefs))
      and (p_involvement  is null or pp.involvement_level = any(p_involvement))
      and (not p_verified_only   or pp.verification_status = 'verified')
      and (p_dob_min is null     or pp.date_of_birth >= p_dob_min)
      and (p_dob_max is null     or pp.date_of_birth <= p_dob_max)

      -- deal-breakers
      and (p_blocked_insem is null
           or pp.insemination_preference is null
           or pp.insemination_preference != all(p_blocked_insem))
      and (p_blocked_inv is null
           or pp.involvement_level is null
           or pp.involvement_level != all(p_blocked_inv))
      and (not p_require_age21 or pp.date_of_birth <= cutoff_21)
      and (not p_same_country  or me.country is null or pp.country = me.country)
  )
  select
    id, first_name, display_name, is_anonymous, date_of_birth, country, role, giver_types,
    insemination_preference, involvement_level, bio, prompts, ethnicity, education,
    hair_color, eye_color, blood_type, alcohol_frequency, smoking_frequency, drug_frequency,
    profile_photo_url, profile_photo_urls, verification_status, is_active, onboarding_complete,
    journeys_completed, created_at, updated_at
  from scored
  order by compat_score desc, created_at desc
  limit p_limit offset p_offset;
end;
$$;

grant execute on function get_browse_profiles to authenticated;
