-- Restrict full profile reads to the owner and expose a safe public view for app surfaces.

drop policy if exists "profiles_select" on profiles;

create policy "profiles_select" on profiles
  for select using (id = auth.uid());

create or replace view public_profiles
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
  is_active,
  onboarding_complete,
  journeys_completed,
  created_at,
  updated_at
from profiles;

grant select on public_profiles to authenticated;
