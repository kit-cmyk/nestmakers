-- NOTE: ranking.sql already re-creates this view with the correct columns.
-- Only run this file if you need to reset the view WITHOUT re-running ranking.sql.
-- Uses CASCADE so the dependent get_browse_profiles function is also dropped;
-- re-run ranking.sql afterward to restore it.

drop view if exists public_profiles cascade;

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
