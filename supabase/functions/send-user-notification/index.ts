import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const PREF_MAP = {
  match: 'notif_new_match',
  message: 'notif_new_message',
  like: 'notif_new_like',
  journey: 'notif_journey_updates',
} as const;

type PreferenceKey = keyof typeof PREF_MAP;

interface NotificationPayload {
  recipientId: string;
  title: string;
  body: string;
  preference: PreferenceKey;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return new Response('Supabase environment variables are not configured', { status: 500 });
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: req.headers.get('Authorization') ?? '' },
    },
  });

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = (await req.json()) as NotificationPayload;
  if (!payload.recipientId || !payload.title || !payload.body || !payload.preference) {
    return new Response('Missing required fields', { status: 400 });
  }

  const preferenceColumn = PREF_MAP[payload.preference];
  if (!preferenceColumn) {
    return new Response('Unsupported preference type', { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile, error } = await admin
    .from('profiles')
    .select('push_token, notif_push_enabled, notif_new_match, notif_new_message, notif_new_like, notif_journey_updates')
    .eq('id', payload.recipientId)
    .single();

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  if (!profile?.push_token || profile.notif_push_enabled === false || profile[preferenceColumn] === false) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const expoResponse = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: profile.push_token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    }),
  });

  if (!expoResponse.ok) {
    return new Response(await expoResponse.text(), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
