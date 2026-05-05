import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import { useAuthStore } from '@/store/authStore';

type Prefs = {
  pushEnabled: boolean;
  newMatch: boolean;
  newMessage: boolean;
  newLike: boolean;
  journeyUpdates: boolean;
  emailEnabled: boolean;
  emailWeeklyDigest: boolean;
  emailSafetyAlerts: boolean;
};

function ToggleRow({ label, sub, value, onChange, disabled }: {
  label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <View style={[s.row, disabled && { opacity: 0.4 }]}>
      <View style={s.rowInfo}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: NM.hair2, true: NM.ink }}
        thumbColor="#fff"
      />
    </View>
  );
}

function profileToPrefs(profile: ReturnType<typeof useAuthStore.getState>['profile']): Prefs {
  return {
    pushEnabled: profile?.notif_push_enabled ?? true,
    newMatch: profile?.notif_new_match ?? true,
    newMessage: profile?.notif_new_message ?? true,
    newLike: profile?.notif_new_like ?? true,
    journeyUpdates: profile?.notif_journey_updates ?? false,
    emailEnabled: profile?.notif_email_enabled ?? true,
    emailWeeklyDigest: profile?.notif_email_weekly_digest ?? false,
    emailSafetyAlerts: profile?.notif_email_safety_alerts ?? true,
  };
}

export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const updateNotificationPrefs = useAuthStore((s) => s.updateNotificationPrefs);

  const [prefs, setPrefs] = useState<Prefs>(() => profileToPrefs(profile));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPrefs(profileToPrefs(profile));
  }, [profile]);

  const set = (key: keyof Prefs) => (v: boolean) => {
    setPrefs((p) => ({ ...p, [key]: v }));
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const err = await updateNotificationPrefs({
      notif_push_enabled: prefs.pushEnabled,
      notif_new_match: prefs.newMatch,
      notif_new_message: prefs.newMessage,
      notif_new_like: prefs.newLike,
      notif_journey_updates: prefs.journeyUpdates,
      notif_email_enabled: prefs.emailEnabled,
      notif_email_weekly_digest: prefs.emailWeeklyDigest,
      notif_email_safety_alerts: prefs.emailSafetyAlerts,
    });
    setSaving(false);
    if (err) {
      setError(err);
    } else {
      setSaved(true);
      setTimeout(() => router.back(), 900);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={NM.ink2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>Push notifications</Text>
        <View style={s.card}>
          <ToggleRow
            label="Enable push notifications"
            sub="Master switch for all push alerts"
            value={prefs.pushEnabled}
            onChange={set('pushEnabled')}
          />
          <View style={s.divider} />
          <ToggleRow
            label="New match"
            sub="When someone matches with you"
            value={prefs.newMatch}
            onChange={set('newMatch')}
            disabled={!prefs.pushEnabled}
          />
          <View style={s.divider} />
          <ToggleRow
            label="New message"
            sub="Incoming messages from your matches"
            value={prefs.newMessage}
            onChange={set('newMessage')}
            disabled={!prefs.pushEnabled}
          />
          <View style={s.divider} />
          <ToggleRow
            label="Someone liked you"
            sub="When a new interest comes in"
            value={prefs.newLike}
            onChange={set('newLike')}
            disabled={!prefs.pushEnabled}
          />
          <View style={s.divider} />
          <ToggleRow
            label="Journey updates"
            sub="Milestone confirmations and legal reminders"
            value={prefs.journeyUpdates}
            onChange={set('journeyUpdates')}
            disabled={!prefs.pushEnabled}
          />
        </View>

        <Text style={[s.sectionLabel, { marginTop: 24 }]}>Email notifications</Text>
        <View style={s.card}>
          <ToggleRow
            label="Enable email notifications"
            sub="Master switch for all email alerts"
            value={prefs.emailEnabled}
            onChange={set('emailEnabled')}
          />
          <View style={s.divider} />
          <ToggleRow
            label="Weekly digest"
            sub="A summary of your matches and activity"
            value={prefs.emailWeeklyDigest}
            onChange={set('emailWeeklyDigest')}
            disabled={!prefs.emailEnabled}
          />
          <View style={s.divider} />
          <ToggleRow
            label="Safety alerts"
            sub="Critical notices from the safety team (recommended)"
            value={prefs.emailSafetyAlerts}
            onChange={set('emailSafetyAlerts')}
            disabled={!prefs.emailEnabled}
          />
        </View>

        {error && (
          <View style={s.errorCard}>
            <Ionicons name="alert-circle-outline" size={14} color="#C0392B" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <View style={s.noteCard}>
          <Ionicons name="information-circle-outline" size={14} color={NM.ink3} />
          <Text style={s.noteText}>
            In-app reminders can still appear while you are actively using Nestmakers.
          </Text>
        </View>

        <NMBtn full onPress={handleSave} disabled={saving}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save preferences'}
        </NMBtn>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: NM.hair,
    backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, color: NM.ink, fontWeight: '600', letterSpacing: -0.2 },
  scroll: { padding: 20, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 10, color: NM.ink3, letterSpacing: 1.2, textTransform: 'uppercase',
    fontWeight: '600', marginBottom: 10,
  },
  card: { backgroundColor: '#fff', borderRadius: NM.r.xl, ...NM.shadow.card, overflow: 'hidden', marginBottom: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowInfo: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 15, color: NM.ink, fontWeight: '500' },
  rowSub: { fontSize: 12, color: NM.ink3, marginTop: 2, lineHeight: 17 },
  divider: { height: 1, backgroundColor: NM.hair, marginHorizontal: 16 },
  noteCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: NM.cream2, borderRadius: NM.r.lg, padding: 12,
    marginBottom: 20,
  },
  noteText: { flex: 1, fontSize: 12, color: NM.ink3, lineHeight: 18 },
  errorCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#FDECEA', borderRadius: NM.r.lg, padding: 12,
    marginBottom: 12,
  },
  errorText: { flex: 1, fontSize: 12, color: '#C0392B', lineHeight: 18 },
});
