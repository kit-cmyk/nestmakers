export type UserRole = 'seeker' | 'giver' | 'both';
export type GiverType = 'egg' | 'sperm' | 'womb' | 'embryo';
export type InsemPref = 'ai' | 'ni' | 'both';
export type InvolvementLevel = 'anonymous' | 'identity_release' | 'limited_contact' | 'known_donor' | 'co_parenting';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  prompts?: ProfilePrompt[];
  display_name: string | null;
  is_anonymous: boolean;
  date_of_birth: string | null;
  country: string | null;
  role: UserRole | null;
  giver_types: GiverType[];
  insemination_preference: InsemPref | null;
  involvement_level: InvolvementLevel | null;
  bio: string | null;
  ethnicity: string | null;
  education: string | null;
  hair_color: string | null;
  eye_color: string | null;
  blood_type: string | null;
  alcohol_frequency: string | null;
  smoking_frequency: string | null;
  drug_frequency: string | null;
  profile_photo_url: string | null;
  profile_photo_urls: string[];
  selfie_video_url: string | null;
  gov_id_url: string | null;
  medical_file_urls: string[];
  verification_status: VerificationStatus;
  is_active: boolean;
  onboarding_complete: boolean;
  push_token: string | null;
  notif_push_enabled: boolean;
  notif_new_match: boolean;
  notif_new_message: boolean;
  notif_new_like: boolean;
  notif_journey_updates: boolean;
  notif_email_enabled: boolean;
  notif_email_weekly_digest: boolean;
  notif_email_safety_alerts: boolean;
  journeys_completed: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProfilePrompt {
  id: string;
  kicker: string;
  answer: string;
  tone: 'lavender' | 'peach' | 'butter' | 'sage';
}

export type PublicProfile = Pick<
  Profile,
  | 'id'
  | 'first_name'
  | 'display_name'
  | 'is_anonymous'
  | 'date_of_birth'
  | 'country'
  | 'role'
  | 'giver_types'
  | 'insemination_preference'
  | 'involvement_level'
  | 'bio'
  | 'ethnicity'
  | 'education'
  | 'hair_color'
  | 'eye_color'
  | 'blood_type'
  | 'alcohol_frequency'
  | 'smoking_frequency'
  | 'drug_frequency'
  | 'profile_photo_url'
  | 'profile_photo_urls'
  | 'verification_status'
  | 'is_active'
  | 'onboarding_complete'
  | 'journeys_completed'
  | 'created_at'
  | 'updated_at'
> & { prompts?: ProfilePrompt[] };

export interface Like {
  id: string;
  from_user_id: string;
  to_user_id: string;
  note: string | null;
  prompt_kicker: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  match_reason: string | null;
  created_at: string;
}

export interface Thread {
  id: string;
  match_id: string;
  last_message_at: string | null;
  created_at: string;
  match?: Match & {
    other_profile?: Profile;
  };
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string | null;
  reason: string;
  details: string | null;
  created_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  blocked_profile?: Pick<Profile, 'id' | 'first_name' | 'display_name' | 'is_anonymous' | 'role' | 'giver_types'>;
}

export const INVOLVEMENT_LABELS: Record<InvolvementLevel, string> = {
  anonymous: 'Anonymous',
  identity_release: 'Identity release',
  limited_contact: 'Limited contact',
  known_donor: 'Known donor',
  co_parenting: 'Co-parenting',
};

export const INSEM_LABELS: Record<InsemPref, string> = {
  ai: 'AI only',
  ni: 'Natural insemination',
  both: 'Either',
};
