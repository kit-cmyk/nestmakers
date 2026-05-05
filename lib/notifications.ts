import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { AppOwnership } from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type NotificationPreference = 'match' | 'message' | 'like' | 'journey';

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;

    // Expo Go can't register push tokens for your own app — requires a dev build.
    if (Constants.appOwnership === AppOwnership.Expo) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Nestmakers',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C9B1E8',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) return null;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch {
    // Push notifications not supported in Expo Go (SDK 53+). Requires a dev build.
    return null;
  }
}

export async function savePushToken(userId: string, token: string) {
  await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', userId);
}

async function sendUserNotification(
  recipientId: string,
  title: string,
  body: string,
  preference: NotificationPreference,
  data?: Record<string, unknown>,
) {
  try {
    await supabase.functions.invoke('send-user-notification', {
      body: {
        recipientId,
        title,
        body,
        preference,
        data: data ?? {},
      },
    });
  } catch {
    // Notifications should never block the user flow.
  }
}

export async function notifyNewMatch(matchedUserId: string, senderName: string) {
  await sendUserNotification(
    matchedUserId,
    'New match!',
    `You matched with ${senderName} on Nestmakers.`,
    'match',
    { type: 'match' },
  );
}

export async function notifyNewMessage(recipientId: string, senderName: string) {
  await sendUserNotification(
    recipientId,
    `Message from ${senderName}`,
    'Tap to read and reply.',
    'message',
    { type: 'message' },
  );
}

export async function notifyJourneyConfirmation(partnerId: string, milestoneLabel: string, confirmerName: string) {
  await sendUserNotification(
    partnerId,
    'Journey confirmation received',
    `${confirmerName} confirmed a ${milestoneLabel}. Open Nestmakers to confirm your side.`,
    'journey',
    { type: 'journey' },
  );
}

export async function notifyNewLike(recipientId: string) {
  await sendUserNotification(
    recipientId,
    'Someone liked your profile',
    'Open Nestmakers to see who.',
    'like',
    { type: 'like' },
  );
}
