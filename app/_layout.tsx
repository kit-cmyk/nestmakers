import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import NMTabBar from '@/components/NMTabBar';
import PremiumSheet from '@/components/PremiumSheet';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { registerForPushNotifications, savePushToken } from '@/lib/notifications';
import { initPurchases, identifyUser } from '@/lib/purchases';
import { useSubscriptionStore } from '@/store/subscriptionStore';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { session, profile, setSession, loadProfile } = useAuthStore();
  const { syncPremiumStatus } = useSubscriptionStore();
  const [isReady, setIsReady] = useState(false);
  const showTabBar = segments.length > 0 && segments[0] !== '(onboarding)' && segments[0] !== '(screens)';
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Step 1: restore session on mount, then mark ready
  useEffect(() => {
    initPurchases();

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        await loadProfile();
        await identifyUser(s.user.id);
        await syncPremiumStatus();
      }
      setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s) {
        await loadProfile();
        await identifyUser(s.user.id);
        await syncPremiumStatus();
        registerForPushNotifications().then((token) => {
          if (token && s.user) savePushToken(s.user.id, token);
        });
      }
    });

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
    };
  }, []);

  // Step 2: only navigate after the navigator has mounted and session is known
  useEffect(() => {
    if (!isReady) return;

    const inOnboarding = segments[0] === '(onboarding)';

    if (!session) {
      if (!inOnboarding) router.replace('/(onboarding)/welcome');
      return;
    }

    if (profile && !profile.onboarding_complete && !inOnboarding) {
      router.replace('/(onboarding)/about');
      return;
    }

    if (profile?.onboarding_complete && inOnboarding) {
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
        <PremiumSheet />
      </View>
    </SafeAreaProvider>
  );
}
