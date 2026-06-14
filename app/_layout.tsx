import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as ExpoLinking from 'expo-linking';
import NMTabBar from '@/components/NMTabBar';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { registerForPushNotifications, savePushToken } from '@/lib/notifications';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { session, profile, setSession, loadProfile } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const showTabBar = segments.length > 0 && segments[0] !== '(onboarding)' && segments[0] !== '(screens)';
  const inResetPassword = segments.includes('reset-password');
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Step 1: restore session on mount, then mark ready
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        await loadProfile();
      }
      setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      if (s) {
        await loadProfile();
        if (event === 'PASSWORD_RECOVERY') {
          router.push('/(onboarding)/reset-password');
          return;
        }
        registerForPushNotifications().then((token) => {
          if (token && s.user) savePushToken(s.user.id, token);
        });
      }
    });

    // Handle password-reset deep links (PKCE: nestmakers://reset-password?code=xxx)
    const handleDeepLink = async (url: string) => {
      const parsed = ExpoLinking.parse(url);
      const code = parsed.queryParams?.code as string | undefined;
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        // onAuthStateChange PASSWORD_RECOVERY fires and navigates to reset-password
      }
    };
    ExpoLinking.getInitialURL().then((url) => { if (url) handleDeepLink(url); });
    const linkSub = ExpoLinking.addEventListener('url', ({ url }) => handleDeepLink(url));

    notifListener.current = Notifications.addNotificationReceivedListener(() => {});
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string };
      if (data?.type === 'message') router.push('/(tabs)/threads');
      else if (data?.type === 'match' || data?.type === 'like') router.push('/(tabs)/interest');
      else if (data?.type === 'journey') router.push('/(screens)/mark-success');
    });

    return () => {
      subscription.unsubscribe();
      notifListener.current?.remove();
      responseListener.current?.remove();
      linkSub.remove();
    };
  }, []);

  // Step 2: only navigate after the navigator has mounted and session is known
  useEffect(() => {
    if (!isReady) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const inTabs = segments[0] === '(tabs)';

    if (!session) {
      if (!inOnboarding) router.replace('/(onboarding)/welcome');
      return;
    }

    if (profile && !profile.onboarding_complete && !inOnboarding) {
      router.replace('/(onboarding)/about');
      return;
    }

    if (profile?.onboarding_complete && !inTabs && !inResetPassword) {
      router.replace('/(tabs)/browse');
    }
  }, [isReady, session, profile]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(screens)" options={{ animation: 'slide_from_right' }} />
        </Stack>
        {showTabBar && <NMTabBar />}
      </View>
    </SafeAreaProvider>
  );
}
