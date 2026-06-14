-- Add GPS coordinates to profiles for radius-based browse filtering.
-- Run AFTER ranking.sql (depends on get_browse_profiles existing).

-- ─── columns ─────────────────────────────────────────────────────────────────
alter table profiles add column if not exists latitude  float8;
alter table profiles add column if not exists longitude float8;

-- Drop the old overloaded signature so CREATE OR REPLACE below is unambiguous.
drop function if exists get_browse_profiles(
  uuid, text[], text[], text[], boolean, date, date, text[], text[], boolean, boolean, integer, integer
);

-- ─── get_browse_profiles — adds p_lat / p_lng / p_radius_km params ───────────
-- All other logic is unchanged; we join against profiles for Haversine so
-- lat/lng never needs to appear in the public_profiles view.
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
  p_lat           float8  default null,
  p_lng           float8  default null,
  p_radius_km     float8  default null,
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
    -- join profiles for lat/lng (not exposed via public_profiles view)
    left join profiles pr_loc on pr_loc.id = pp.id
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

      -- role compatibility
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

      -- radius filter: skip if any param is missing, or if candidate has no coords
      and (
        p_radius_km is null or p_lat is null or p_lng is null
        or (
          pr_loc.latitude  is not null
          and pr_loc.longitude is not null
          and 6371 * acos(
            least(1.0,
              cos(radians(p_lat)) * cos(radians(pr_loc.latitude))
                * cos(radians(pr_loc.longitude) - radians(p_lng))
              + sin(radians(p_lat)) * sin(radians(pr_loc.latitude))
            )
          ) <= p_radius_km
        )
      )
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
