import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updatePushToken: (token: string) => Promise<void>;
  updateNotificationPrefs: (prefs: Partial<Pick<import('@/types/database').Profile,
    'notif_push_enabled' | 'notif_new_match' | 'notif_new_message' | 'notif_new_like' |
    'notif_journey_updates' | 'notif_email_enabled' |
    'notif_email_weekly_digest' | 'notif_email_safety_alerts'
  >>) => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return error.message;
      if (data.session) set({ session: data.session });
      await get().loadProfile();
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return error.message;
      if (data.session) set({ session: data.session });
      if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, email });
      }
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'nestmakers://', skipBrowserRedirect: true },
      });
      if (error || !data.url) return error?.message ?? 'Could not start Google sign-in';

      const result = await WebBrowser.openAuthSessionAsync(data.url, 'nestmakers://');
      if (result.type !== 'success') return null; // user cancelled

      const codeMatch = result.url.match(/[?&]code=([^&#]+)/);
      const code = codeMatch?.[1];
      if (!code) return 'Google sign-in did not return an auth code';

      const { data: sessionData, error: codeError } = await supabase.auth.exchangeCodeForSession(code);
      if (codeError) return codeError.message;

      if (sessionData?.session) {
        set({ session: sessionData.session });
        const { id: userId, email: userEmail } = sessionData.session.user;
        const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).single();
        if (!existing) {
          await supabase.from('profiles').insert({ id: userId, email: userEmail ?? '' });
        }
        await get().loadProfile();
      }
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },

  loadProfile: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (data) set({ profile: data as Profile });
  },

  updatePushToken: async (token) => {
    const { session } = get();
    if (!session?.user) return;
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', session.user.id);
    set((s) => ({ profile: s.profile ? { ...s.profile, push_token: token } : null }));
  },

  updateNotificationPrefs: async (prefs) => {
    const { session } = get();
    if (!session?.user) return 'Not authenticated';
    const { error } = await supabase
      .from('profiles')
      .update(prefs)
      .eq('id', session.user.id);
    if (error) return error.message;
    set((s) => ({ profile: s.profile ? { ...s.profile, ...prefs } : null }));
    return null;
  },
}));
