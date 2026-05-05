import { PublicProfile } from '@/types/database';

export const PUBLIC_PROFILE_SELECT = `
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
`.replace(/\s+/g, ' ').trim();

export function asPublicProfiles(rows: unknown): PublicProfile[] {
  return (rows as PublicProfile[] | null) ?? [];
}

export function asPublicProfile(row: unknown): PublicProfile | null {
  return (row as PublicProfile | null) ?? null;
}
