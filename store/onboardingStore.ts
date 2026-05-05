import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { GiverType, InsemPref, InvolvementLevel, UserRole } from '@/types/database';
import { useAuthStore } from '@/store/authStore';

interface OnboardingData {
  // Step 1: About
  firstName: string;
  lastName: string;
  isAnonymous: boolean;
  displayName: string;
  dateOfBirth: string;
  country: string;
  // Step 2: Role
  role: UserRole;
  // Step 3: Needs / Giver type
  giverTypes: GiverType[];
  // Step 4: Insemination preference
  inseminationPreference: InsemPref;
  // Step 5: Involvement level
  involvementLevel: InvolvementLevel;
  // Step 6: Lifestyle
  ethnicity: string;
  education: string;
  hairColor: string;
  eyeColor: string;
  bloodType: string;
  alcoholFrequency: string;
  smokingFrequency: string;
  drugFrequency: string;
  // Step 7: Medical history (URLs set after upload)
  medicalFileUrls: string[];
  // Step 8: Profile photos (first is primary)
  photoUrls: string[];
}

interface OnboardingState extends OnboardingData {
  setAbout: (data: Pick<OnboardingData, 'firstName' | 'lastName' | 'isAnonymous' | 'displayName' | 'dateOfBirth' | 'country'>) => void;
  setRole: (role: UserRole) => void;
  setGiverTypes: (types: GiverType[]) => void;
  setInsemPref: (pref: InsemPref) => void;
  setInvolvement: (level: InvolvementLevel) => void;
  setLifestyle: (data: Pick<OnboardingData, 'ethnicity' | 'education' | 'hairColor' | 'eyeColor' | 'bloodType' | 'alcoholFrequency' | 'smokingFrequency' | 'drugFrequency'>) => void;
  setMedicalFiles: (urls: string[]) => void;
  setPhotoUrls: (urls: string[]) => void;
  saveProfile: () => Promise<string | null>;
  reset: () => void;
}

const defaults: OnboardingData = {
  firstName: '',
  lastName: '',
  isAnonymous: false,
  displayName: '',
  dateOfBirth: '',
  country: '',
  role: 'seeker',
  giverTypes: [],
  inseminationPreference: 'ai',
  involvementLevel: 'limited_contact',
  ethnicity: '',
  education: '',
  hairColor: '',
  eyeColor: '',
  bloodType: '',
  alcoholFrequency: 'Never',
  smokingFrequency: 'Never',
  drugFrequency: 'Never',
  medicalFileUrls: [],
  photoUrls: [],
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...defaults,

  setAbout: (data) => set(data),
  setRole: (role) => set({ role }),
  setGiverTypes: (giverTypes) => set({ giverTypes }),
  setInsemPref: (inseminationPreference) => set({ inseminationPreference }),
  setInvolvement: (involvementLevel) => set({ involvementLevel }),
  setLifestyle: (data) => set(data),
  setMedicalFiles: (medicalFileUrls) => set({ medicalFileUrls }),
  setPhotoUrls: (photoUrls) => set({ photoUrls }),

  saveProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Not authenticated';

    const s = get();
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: s.firstName,
        last_name: s.lastName,
        display_name: s.isAnonymous ? s.displayName : null,
        is_anonymous: s.isAnonymous,
        date_of_birth: s.dateOfBirth,
        country: s.country,
        role: s.role,
        giver_types: s.giverTypes,
        insemination_preference: s.inseminationPreference,
        involvement_level: s.involvementLevel,
        ethnicity: s.ethnicity,
        education: s.education,
        hair_color: s.hairColor,
        eye_color: s.eyeColor,
        blood_type: s.bloodType,
        alcohol_frequency: s.alcoholFrequency,
        smoking_frequency: s.smokingFrequency,
        drug_frequency: s.drugFrequency,
        medical_file_urls: s.medicalFileUrls,
        profile_photo_url: s.photoUrls[0] ?? null,
        profile_photo_urls: s.photoUrls,
        onboarding_complete: true,
      })
      .eq('id', user.id);

    return error ? error.message : null;
  },

  reset: () => set(defaults),
}));
